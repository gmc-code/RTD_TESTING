document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".noise-monitor-card");

    cards.forEach(card => {
        const toggleBtn = card.querySelector(".noise-btn-toggle");
        const dbValueEl = card.querySelector(".noise-db-value");
        const meterBar = card.querySelector(".noise-meter-bar");
        const statusText = card.querySelector(".noise-status-text");
        const noiseImageEl = card.querySelector(".noise-image");

        if (!toggleBtn) return;

        const threshold =
            Number(card.dataset.threshold) || 60;

        // The dB range the 6 images are scaled across. Defaults to
        // the full 0-100 meter scale, but can be narrowed via the
        // image-min / image-max directive options.
        let imageRangeMin = Number(card.dataset.imageMin);
        let imageRangeMax = Number(card.dataset.imageMax);

        if (!Number.isFinite(imageRangeMin)) {
            imageRangeMin = 0;
        }
        if (!Number.isFinite(imageRangeMax) || imageRangeMax <= imageRangeMin) {
            imageRangeMax = 100;
        }

        // Images for each noise "band", lowest to highest
        // (noise0.png ... noise5.png), read from the data-imgN
        // attributes rendered by the Sphinx directive.
        const noiseImages = [];
        for (let i = 0; i < 6; i++) {
            const src = card.dataset[`img${i}`];
            if (src) {
                noiseImages.push(src);
            }
        }

        // The image only jumps UP immediately when the level rises.
        // When the level drops, it has to stay below the currently
        // shown band continuously for DROP_DELAY_MS before the
        // image is allowed to drop - so a brief lull doesn't cause
        // constant flickering between images.
        const DROP_DELAY_MS = 10000;
        let displayedBand = 0;
        let belowSince = null; // timestamp (ms), or null if not currently pending a drop

        function computeBand(db) {

            if (noiseImages.length === 0) {
                return 0;
            }

            const bandCount = noiseImages.length;

            const clamped =
                Math.max(imageRangeMin, Math.min(imageRangeMax, db));

            const fraction =
                (clamped - imageRangeMin) / (imageRangeMax - imageRangeMin);

            const band = Math.floor(fraction * bandCount);

            return Math.max(0, Math.min(bandCount - 1, band));
        }

        function setDisplayedImage(band) {

            displayedBand = band;

            const nextSrc = noiseImages[band];

            if (noiseImageEl && nextSrc &&
                noiseImageEl.getAttribute("src") !== nextSrc) {

                noiseImageEl.src = nextSrc;
            }
        }

        function resetNoiseImage() {
            belowSince = null;
            setDisplayedImage(0);
        }

        function updateNoiseImage(db) {

            if (!noiseImageEl || noiseImages.length === 0) {
                return;
            }

            const targetBand = computeBand(db);
            const now = performance.now();

            if (targetBand > displayedBand) {

                // Louder than what's shown - jump up right away.
                belowSince = null;
                setDisplayedImage(targetBand);

            } else if (targetBand < displayedBand) {

                // Quieter than what's shown - only drop once it's
                // stayed that way continuously for DROP_DELAY_MS.
                if (belowSince === null) {
                    belowSince = now;
                } else if (now - belowSince >= DROP_DELAY_MS) {
                    // Recompute in case the level has moved again
                    // during the wait.
                    setDisplayedImage(computeBand(db));
                    belowSince = null;
                }

            } else {
                // Matches what's already shown - nothing pending.
                belowSince = null;
            }
        }

        let audioCtx = null;
        let analyser = null;
        let microphone = null;
        let mediaStream = null;
        let animationFrame = null;
        let isMonitoring = false;
        let dataArray = null;

        // Auto-calibration: measured once per session so that
        // "silence" on THIS device/room reads as ~0, instead of
        // relying on a fixed offset that assumes a specific mic
        // gain/sensitivity.
        let noiseFloorOffset = 0;
        const CALIBRATION_MS = 1200;

        toggleBtn.addEventListener("click", async () => {

            if (isMonitoring) {
                stopMonitoring();
                return;
            }

            try {
                // Check that the browser supports microphone access
                if (!navigator.mediaDevices ||
                    !navigator.mediaDevices.getUserMedia) {

                    throw new Error(
                        "getUserMedia is not supported by this browser."
                    );
                }

                // Ask for microphone
                mediaStream =
                    await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: false
                        },
                        video: false
                    });

                // Create audio context
                const AudioContext =
                    window.AudioContext ||
                    window.webkitAudioContext;

                if (!AudioContext) {
                    throw new Error(
                        "Web Audio API is not supported."
                    );
                }

                audioCtx = new AudioContext();

                // Some browsers start the context suspended
                if (audioCtx.state === "suspended") {
                    await audioCtx.resume();
                }

                // Create analyser
                analyser = audioCtx.createAnalyser();

                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.7;

                dataArray =
                    new Float32Array(analyser.fftSize);

                // Connect microphone to analyser
                microphone =
                    audioCtx.createMediaStreamSource(
                        mediaStream
                    );

                microphone.connect(analyser);

                if (statusText) {
                    statusText.textContent =
                        "Calibrating... please stay quiet";
                }
                if (toggleBtn) {
                    toggleBtn.disabled = true;
                }

                noiseFloorOffset = await calibrateNoiseFloor();

                if (toggleBtn) {
                    toggleBtn.disabled = false;
                }

                isMonitoring = true;
                resetNoiseImage();

                toggleBtn.textContent = "Stop Mic Monitor";
                toggleBtn.classList.add("active");

                if (statusText) {
                    statusText.textContent =
                        "Monitoring microphone...";
                }

                processAudio();

            } catch (err) {

                console.error(
                    "Noise monitor microphone error:",
                    err
                );

                stopMonitoring();

                if (err.name === "NotAllowedError") {
                    alert(
                        "Microphone access was blocked. " +
                        "Please allow microphone access for this site."
                    );
                } else {
                    alert(
                        "Could not access the microphone.\n\n" +
                        err.message
                    );
                }
            }
        });


        // Calculates RMS from the current analyser buffer.
        function getCurrentRms() {

            analyser.getFloatTimeDomainData(dataArray);

            let sumSquares = 0;

            for (let i = 0; i < dataArray.length; i++) {
                sumSquares += dataArray[i] * dataArray[i];
            }

            return Math.sqrt(sumSquares / dataArray.length);
        }

        // Converts RMS to the uncalibrated 0-100ish scale,
        // BEFORE the per-session noise-floor offset is applied.
        function rmsToRawDb(rms) {

            if (rms <= 0.00001) {
                return 0;
            }

            return (20 * Math.log10(rms)) + 100;
        }

        /*
         * Samples the mic for CALIBRATION_MS while (hopefully)
         * the room is quiet, and returns the average "raw" dB
         * reading. This becomes the new zero point, so that
         * this specific device/room's noise floor - mic
         * self-noise, OS input gain, quantization, etc. - reads
         * as ~0 instead of whatever the fixed +100 offset
         * happens to produce.
         */
        function calibrateNoiseFloor() {

            return new Promise(resolve => {

                const samples = [];
                const startTime = performance.now();

                function sample() {

                    if (!analyser) {
                        resolve(0);
                        return;
                    }

                    samples.push(
                        rmsToRawDb(getCurrentRms())
                    );

                    if (performance.now() - startTime < CALIBRATION_MS) {
                        requestAnimationFrame(sample);
                        return;
                    }

                    const average =
                        samples.reduce((a, b) => a + b, 0) /
                        Math.max(samples.length, 1);

                    // Clamp: never trust a wildly high or
                    // negative "silence" reading (e.g. if the
                    // room genuinely wasn't quiet during setup).
                    resolve(
                        Math.max(0, Math.min(60, average))
                    );
                }

                requestAnimationFrame(sample);
            });
        }

        function processAudio() {

            if (!isMonitoring || !analyser) {
                return;
            }

            const rms = getCurrentRms();

            /*
             * Convert RMS to an approximate dB SPL-style
             * display, then subtract this session's calibrated
             * noise floor so the room's actual quiet level
             * reads near 0.
             *
             * IMPORTANT:
             * A browser microphone does NOT provide calibrated
             * real-world dB SPL. This is therefore an
             * approximate relative noise level, calibrated
             * per-session rather than to a physical reference.
             */

            let db = rmsToRawDb(rms) - noiseFloorOffset;

            db = Math.round(db);

            // Keep within 0–100
            db = Math.max(0, Math.min(100, db));


            // Update numerical reading
            if (dbValueEl) {
                dbValueEl.textContent = db;
            }


            // Update meter
            if (meterBar) {
                meterBar.style.width = db + "%";
                meterBar.classList.toggle("danger", db >= threshold);
            }

            // Update noise-level image
            updateNoiseImage(db);


            // Update status
            if (statusText) {

                if (db >= threshold) {

                    statusText.textContent =
                        "⚠️ High Noise Level Detected!";

                    statusText.classList.add("text-danger");
                    statusText.classList.remove("text-safe");

                } else {

                    statusText.textContent =
                        "Quiet environment.";

                    statusText.classList.add("text-safe");
                    statusText.classList.remove("text-danger");
                }
            }


            // Continue monitoring
            animationFrame =
                requestAnimationFrame(processAudio);
        }


        function stopMonitoring() {

            isMonitoring = false;
            noiseFloorOffset = 0;

            if (toggleBtn) {
                toggleBtn.disabled = false;
            }


            if (animationFrame !== null) {

                cancelAnimationFrame(
                    animationFrame
                );

                animationFrame = null;
            }


            if (mediaStream) {

                mediaStream
                    .getTracks()
                    .forEach(track => track.stop());

                mediaStream = null;
            }


            if (microphone) {

                try {
                    microphone.disconnect();
                } catch (e) {}

                microphone = null;
            }


            if (audioCtx) {

                try {
                    audioCtx.close();
                } catch (e) {}

                audioCtx = null;
            }


            analyser = null;
            dataArray = null;


            toggleBtn.textContent =
                "Start Mic Monitor";
            toggleBtn.classList.remove("active");


            if (dbValueEl) {
                dbValueEl.textContent = "0";
            }


            if (meterBar) {
                meterBar.style.width = "0%";
                meterBar.classList.remove("danger");
            }

            resetNoiseImage();


            if (statusText) {

                statusText.textContent =
                    "Monitoring stopped.";

                statusText.classList.remove("text-safe", "text-danger");
            }
        }
    });
});