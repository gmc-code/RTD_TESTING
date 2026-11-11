=====================================
Stringybark Food Web with Questions
=====================================

This activity puts a food web and questions about it in one block, using
the ``activitygroup`` directive. The first directive in the group is the
food web (``foodweb``) and the directives after it are the questions
(``multichoice`` and ``gapfill``).

The questions are locked until the food web is finished. The **Print
activity and questions** button prints the food web and its questions
together.

Complete the web, then answer the questions
===========================================

``:reveal: answer`` unlocks the questions when every organism is in the
right place and **Check** is pressed, or when **Show answer** is pressed.
Use ``:reveal: check`` to unlock them only when the web is correct.

.. code-block:: rst

   .. activitygroup::
      :title: Part of the stringybark forest
      :reveal: answer
      :locked-message: Complete the food web first. The questions will then appear here.

      Drag each picture from the tray into the right box, then press **Check**.

      .. foodweb:: Part of the forest
         :images: Stringybark_forest/{name}.png
         :theme: forest
         :apex: top

         Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
         Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
         Honeyeater, Thornbill → Quoll
         Brown stringybark → Termite → Skink → Brown snake

      .. multichoice::

         Which organism is the producer in this food web?

         [x] Brown stringybark | Correct. It makes its own food from sunlight.
         [ ] Termite | Incorrect. The termite eats the brown stringybark.
         [ ] Quoll | Incorrect. The quoll is a carnivore.
         [ ] Scale insect | Incorrect. The scale insect eats the brown stringybark.

      .. gapfill::
         :instructions: Use the arrows in the food web to complete the sentences.

         The brown snake eats honeyeaters, thornbills and @@skinks | termites | quolls@@.
         The ring-tailed possum is eaten by the quoll and the @@wedge-tailed eagle | brown snake | honeyeater@@.
         The scale insect, the termite and the ring-tailed possum are all @@herbivores | carnivores | producers@@.

      .. multichoice::

         If all the termites were removed, which animal would lose its only food in this food web?

         [x] Skink | Correct. In this food web the skink eats only termites.
         [ ] Brown snake | Incorrect. The brown snake also eats honeyeaters and thornbills.
         [ ] Quoll | Incorrect. The quoll does not eat termites.
         [ ] Honeyeater | Incorrect. The honeyeater eats scale insects.

      .. gapfill::
         :instructions: Complete this food chain from the food web.

         Brown stringybark → @@scale insect | termite | ring-tailed possum@@ → honeyeater → @@brown snake | skink | thornbill@@ → wedge-tailed eagle

.. activitygroup::
   :title: Part of the stringybark forest
   :reveal: answer
   :locked-message: Complete the food web first. The questions will then appear here.

   Drag each picture from the tray into the right box, then press **Check**.

   .. foodweb:: Part of the forest
      :images: Stringybark_forest/{name}.png
      :theme: forest
      :apex: top

      Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
      Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
      Honeyeater, Thornbill → Quoll
      Brown stringybark → Termite → Skink → Brown snake

   .. multichoice::

      Which organism is the producer in this food web?

      [x] Brown stringybark | Correct. It makes its own food from sunlight.
      [ ] Termite | Incorrect. The termite eats the brown stringybark.
      [ ] Quoll | Incorrect. The quoll is a carnivore.
      [ ] Scale insect | Incorrect. The scale insect eats the brown stringybark.

   .. gapfill::
      :instructions: Use the arrows in the food web to complete the sentences.

      The brown snake eats honeyeaters, thornbills and @@skinks | termites | quolls@@.
      The ring-tailed possum is eaten by the quoll and the @@wedge-tailed eagle | brown snake | honeyeater@@.
      The scale insect, the termite and the ring-tailed possum are all @@herbivores | carnivores | producers@@.

   .. multichoice::

      If all the termites were removed, which animal would lose its only food in this food web?

      [x] Skink | Correct. In this food web the skink eats only termites.
      [ ] Brown snake | Incorrect. The brown snake also eats honeyeaters and thornbills.
      [ ] Quoll | Incorrect. The quoll does not eat termites.
      [ ] Honeyeater | Incorrect. The honeyeater eats scale insects.

   .. gapfill::
      :instructions: Complete this food chain from the food web.

      Brown stringybark → @@scale insect | termite | ring-tailed possum@@ → honeyeater → @@brown snake | skink | thornbill@@ → wedge-tailed eagle
