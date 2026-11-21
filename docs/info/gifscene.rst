==========
GIF scene
==========

The ``gifscene`` directive makes a picture full of surprises. Each item in it is an
animated GIF that sits still until a student clicks it, then it plays: the star
twinkles, the bell rings, the present opens. A counter shows how many have been
clicked, and there is a message (and snow, bubbles or confetti) when every one has
been found. A theme sets the colours and the words to suit the scene.

Click a picture to bring it to life.

.. gifscene::
    :theme: christmas
    :title: Christmas scene
    :background: images/christmas_images/background.png
    :folder: images/christmas_images
    :start-effect:
    :sound:

    star.gif | Star | x=50 y=14 width=16.5
    bauble.gif | Bauble | x=18 y=75 width=7
    bell.gif | Bell | x=27.7 y=75 width=8
    tree.gif | Christmas tree | x=22 y=58 width=20
    snowman.gif | Snowman | x=72 y=66 width=15
    present.gif | Present | x=37 y=82 width=10
    candle.gif | Candle | x=55.7 y=67.5 width=8
    gingerbread.gif | Gingerbread | x=89 y=80 width=10
    santa_sleigh.gif | Santa's sleigh | x=40 y=33 width=30 seconds=8 move=right
    shooting_star.gif | Shooting star | x=71.5 y=5.1 width=13 seconds=3 move=left
    elf_green.gif | Green elf | x=47 y=91 width=8 seconds=6 move=right
    elf_red.gif | Red elf | x=40 y=93 width=9.5 seconds=6.5 move=right
    penguin.gif | Penguin | x=75.6 y=95.5 width=7.5 seconds=6 move=left
    snowball.gif | Snowball | x=9.4 y=89.6 width=5 seconds=7 move=right

The sleigh, the shooting star, the elves, the penguin and the snowball have ``move=`` on
their lines, so they travel across the scene when they are clicked.

----

A beach scene
-------------

The same directive with ``:theme: beach``, which brings ocean colours, bubbles and a
summery message. The pictures that travel
use the other paths: the seagull and the boat bob along (``wave-``), the kangaroo and the
ball bounce (``hop-``) and the dolphin leaps (``jump``).

.. gifscene::
    :theme: beach
    :title: Summer at the beach
    :background: images/beach_images/background.png
    :folder: images/beach_images
    :sound:

    sun.gif | Sun | x=86 y=15 width=13
    cloud.gif | Cloud | x=34 y=13 width=15 seconds=24 move=right
    seagull.gif | Seagull | x=62 y=27 width=8 seconds=10 move=wave-left
    sailboat.gif | Sailboat | x=58 y=45.5 width=7 seconds=20 move=wave-right
    dolphin.gif | Dolphin | x=80 y=57 width=10 seconds=1.5 move=jump
    surfer.gif | Surfer | x=28 y=60 width=10 seconds=9 move=wave-right
    flag.gif | Red and yellow flag | x=6 y=69 width=6
    flag.gif | Other flag | x=46 y=69 width=6
    umbrella.gif | Beach umbrella | x=74 y=74 width=15
    sandcastle.gif | Sandcastle | x=55 y=84 width=10
    esky.gif | Esky | x=92 y=85 width=8
    kangaroo.gif | Kangaroo | x=21 y=80 width=11 seconds=7 move=hop-right
    beach_ball.gif | Beach ball | x=37 y=90 width=5 seconds=7 move=hop-left
    crab.gif | Crab | x=66 y=93 width=6 seconds=10 move=left

----

As a grid
---------------

Leave out ``:background:`` and the pictures are set out as cards. This one uses
``:play: toggle``, so a click starts a picture and another click stops it.

.. gifscene::
   :theme: christmas
   :title: Christmas cards
   :folder: images/christmas_images
   :columns: 4
   :play: toggle

   star.gif
   bell.gif
   bauble.gif
   present.gif
   candle.gif
   snowman.gif
   tree.gif | Christmas tree
   gingerbread.gif
   santa_sleigh.gif | Santa's sleigh
   elf_green.gif | Green elf
   elf_red.gif | Red elf
   penguin.gif
   snowball.gif
   shooting_star.gif | Shooting star

----

Getting started
---------------

#. Put a background picture and your GIFs in a folder next to the page.
#. Add the directive, with one line for each GIF:

   .. code-block:: rst

      .. gifscene::
         :theme: christmas
         :title: Our Christmas scene
         :background: christmas/background.png
         :folder: christmas
         :start-effect:

         star.gif    | Star
         tree.gif    | Christmas tree
         present.gif | Present

#. Build the site and open the page. The pictures sit in a row near the bottom.
#. Press **Arrange**, drag each picture to where it belongs, set its size, then
   press **Copy** and paste the lines back over the picture lines in the directive.


Using the scene
---------------

.. list-table::
   :header-rows: 1
   :widths: 26 74

   * - Control
     - What it does
   * - Click a picture
     - Plays its GIF. What a second click does depends on the play mode (see
       `Play modes`_).
   * - **Play all**
     - Plays every picture, one after another.
   * - **Stop all**
     - Returns every picture to its still frame.
   * - **Snow**, **Bubbles** or **Confetti**
     - Turns the effect on or off. The theme or ``:effect:`` decides which one it is.
   * - **Sound**
     - Turns the chime on or off. Each picture has its own note.
   * - **Arrange**
     - Lets you drag pictures to new places and resize them (scenes only). See
       `Arranging the pictures`_.
   * - **Full screen**
     - Fills the screen, for a projector.

The pictures can also be reached with the Tab key and played with Enter or the
space bar.


Scene or grid
-------------

With ``:background:`` the pictures are placed over the background picture. Each
one has a position (``x`` across and ``y`` down, as percentages of the background)
and a ``width`` (a percentage of the background's width), so the scene keeps its
layout at any size, including full screen.

Without ``:background:`` the pictures are set out as a grid of cards with their
names underneath. ``:columns:`` sets how many are in a row.


Play modes
----------

.. list-table::
   :header-rows: 1
   :widths: 26 74

   * - ``:play:``
     - What a click does
   * - ``once`` (default)
     - Plays the GIF once through from its first frame, then returns to the still
       picture. Clicking while it is playing starts it again.
   * - ``toggle``
     - Starts the GIF. It keeps going until it is clicked again.
   * - ``hover``
     - Plays while the mouse is over the picture. On a touch screen a tap starts
       and stops it.

The length of each GIF is read from the file when the site is built, so ``once``
plays exactly one run. Add ``seconds=`` to a line to make a picture play for
longer or shorter, for example ``seconds=3`` to let a 1 second GIF repeat three
times.


Pictures that travel
--------------------

Add ``move=`` to a line and the picture travels when it is clicked, with its GIF playing
the whole way. Every trip ends with the picture back in its place.

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - ``move=``
     - Path
   * - ``right`` / ``left``
     - Straight off that side of the scene, back in on the other side and home.
   * - ``up`` / ``down``
     - The same, off the top or the bottom.
   * - ``wave-right`` / ``wave-left``
     - Across and back in, bobbing up and down like a wave (a seagull, a boat).
   * - ``hop-right`` / ``hop-left``
     - Across and back in, bouncing in hops (a kangaroo, a ball).
   * - ``jump``
     - Leaps up in an arc, tilting nose up then nose down, and lands in its place
       (a dolphin).

.. code-block:: rst

   santa_sleigh.gif | Santa's sleigh | x=40 y=33 width=30 move=right seconds=8
   kangaroo.gif     | Kangaroo       | x=21 y=80 width=11 move=hop-right seconds=7
   dolphin.gif      | Dolphin        | x=80 y=57 width=10 move=jump

* ``seconds`` is how long the whole trip takes: 6 if it is left out, or 1.5 for ``jump``.
  A bigger number makes a slower trip.
* Waves and hops are sized from the picture (higher hops for a taller picture), and a lap
  always holds a whole number of them, so the picture lands exactly where it started.
* Draw the picture facing the way it travels. The sleigh and the elves face right; the
  penguin, the shooting star and the seagull face left.
* In ``toggle`` mode the picture keeps doing laps (or jumps) until it is clicked again.
* Travelling only happens in a scene. In a grid the GIF plays on the spot.


Themes and effects
------------------

``:theme:`` sets the colours and the defaults for the title, the effect, the icon and
the finishing message. Anything you set on the directive wins over the theme.

.. list-table::
   :header-rows: 1
   :widths: 16 18 14 8 44

   * - ``:theme:``
     - Default title
     - Effect
     - Icon
     - Message
   * - (left out)
     - Scene
     - confetti
     - ★
     - You found them all!
   * - ``christmas``
     - Christmas
     - snow
     - 🎄
     - You found them all. Merry Christmas!
   * - ``beach``
     - At the beach
     - bubbles
     - ☀
     - You found them all. Have a sunny summer holiday!

* The effect is ``snow`` (falls), ``bubbles`` (rise from the bottom) or ``confetti``
  (falls and spins). It always comes on when every picture has been found;
  ``:start-effect:`` also turns it on when the page opens.
* Leaving out ``:theme:`` gives a neutral navy and gold box. ``christmas`` is green,
  red and gold; ``beach`` uses ocean colours.


Arranging the pictures
----------------------

#. Press **Arrange**. Each picture gets a dashed outline and its name.
#. Drag a picture to move it. Click it and use the **Size** slider to resize it.
   The arrow keys move the chosen picture a little at a time.
#. The box under the scene lists every picture with its new position. Press
   **Copy** and paste the lines over the picture lines in the directive.
#. Press **Arrange** again to finish.

Positions are not saved by the page itself. They only last once they are pasted
into the directive (or, in the student kit, into ``my_scene.js``).


Making GIFs that work well
--------------------------

* **See-through background.** Export with *Transparency* ticked so the scene
  shows around the picture.
* **Square and small.** 300 × 300 pixels is plenty. Most GIFs in the example are
  under 70 KB.
* **A good first frame.** The first frame is what shows before the click, so it
  should be the "resting" picture: the closed present, the bell hanging straight.
* **Short.** One or two seconds, 4 to 12 frames.
* **Looping set to Forever** suits every play mode. A GIF exported with *Once*
  still works, but stops on its last frame in ``toggle`` and ``hover`` modes.

To show a different picture before the click (a wrapped box that turns into
something else, for example), add ``still=wrapped.png`` to the line.


Running it as a class activity
------------------------------

The christmas_tutorial uses a kit that runs
without this website: students unzip a folder, make GIFs in Photoshop, add a line
for each one to ``my_scene.js`` and double-click ``index.html``.

Troubleshooting
---------------

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Problem
     - Fix
   * - A red dashed box says "Cannot find ..."
     - The file name on the line does not match the file. Check the spelling,
       capital letters and the ``.gif`` ending, and that ``:folder:`` is right.
   * - A picture does not move when clicked
     - It has only one frame. Re-export it from the Timeline as a GIF; the build
       gives a warning that names the file.
   * - A picture has a white box around it
     - It was exported without *Transparency*, or its bottom layer is a white
       background layer.
   * - A picture stops too soon or too late
     - Add ``seconds=`` to its line.
   * - No snow (or bubbles, confetti)
     - Add ``:start-effect:`` or press the effect button. It does not start by itself on
       devices set to reduce motion.
   * - A picture does not travel
     - Check the ``move=`` word against the table in `Pictures that travel`_. The
       build gives a warning for one it does not know.


----

For developers
--------------

The ``gifscene`` directive shows animated GIFs that stay on their first frame
until they are clicked.

Installing
~~~~~~~~~~

#. Copy the ``gifscene`` folder into ``docs/_ext``. It holds ``__init__.py``,
   ``gifscene.py`` and ``_static/gifscene.css`` and ``_static/gifscene.js``.
#. Add it to ``extensions`` in ``conf.py``:

   .. code-block:: python

      extensions = [
          "gifscene.gifscene",
      ]

No extra Python packages are needed. GIF sizes and lengths are read by a small
parser in ``gifscene.py``.


Directive
~~~~~~~~~

.. code-block:: rst

   .. gifscene::
      :theme: christmas
      :title: Our Christmas scene
      :background: christmas/background.png
      :folder: christmas
      :play: once
      :start-effect:
      :sound:

      star.gif    | Star    | x=50 y=14 width=9
      present.gif | Present | x=37 y=82 width=10 seconds=3
      box.gif     | Mystery | x=60 y=80 width=10 still=box_wrapped.png


Options
~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 24 16 60

   * - Option
     - Default
     - Meaning
   * - ``:theme:``
     - none
     - ``christmas`` or ``beach``. Sets the colours and the defaults for
       ``:title:``, ``:effect:``, ``:icon:`` and ``:message:`` (see
       `Themes and effects`_).
   * - ``:title:``
     - from the theme
     - Heading shown above the scene.
   * - ``:background:``
     - none
     - Background picture. With it the pictures are placed by position (a scene);
       without it they are set out as a grid.
   * - ``:folder:``
     - none
     - Folder that holds the pictures, so each line only needs a file name. It is
       relative to the page, or to the top of ``docs`` if it starts with ``/``.
   * - ``:play:``
     - once
     - ``once``, ``toggle`` or ``hover``.
   * - ``:columns:``
     - 4
     - Cards in each row of a grid (1 to 8).
   * - ``:message:``
     - from the theme
     - Shown when every picture has been clicked.
   * - ``:effect:``
     - from the theme
     - ``snow``, ``bubbles`` or ``confetti``.
   * - ``:icon:``
     - from the theme
     - Shown in front of ``:message:``.
   * - ``:start-effect:``
     - off
     - Start with the effect on.
   * - ``:sound:``
     - off
     - Start with the chime on.
   * - ``:hide-names:``
     - off
     - Do not show the picture names.
   * - ``:class:``
     - none
     - Extra CSS classes for the outer ``div``.


Content lines
~~~~~~~~~~~~~

Each line is ``file | name | settings``. Blank lines and lines starting with
``#`` are skipped. The name defaults to the file name. Settings are separated by
spaces:

.. list-table::
   :header-rows: 1
   :widths: 24 76

   * - Setting
     - Meaning
   * - ``x=`` ``y=``
     - Centre of the picture, as a percentage across and down the background
       (0 to 100). Left out, the pictures are spread in a row at ``y=80``.
   * - ``width=``
     - Width as a percentage of the background's width.
   * - ``seconds=``
     - How long the picture plays in ``once`` mode. The default is the length of
       one run of the GIF, read from the file.
   * - ``still=``
     - A picture to show while the GIF is not playing, in place of its first frame.
   * - ``move=``
     - ``right``, ``left``, ``up``, ``down``, ``wave-right``, ``wave-left``,
       ``hop-right``, ``hop-left`` or ``jump`` (see `Pictures that travel`_).
       ``seconds`` is then the time for the trip (default 6, or 1.5 for ``jump``).
       Scenes only.


How it works
~~~~~~~~~~~~

* **At build time** each picture is found (in ``:folder:``, then next to the
  page), copied to ``_static/gifscene-media`` under a name that starts with a
  checksum of the file, and described in a JSON block on a
  ``<div class="gifscene" data-gifscene="...">``. A changed GIF therefore gets
  a new address and is never served from an old cached copy.
* **The still frame** is the first frame of the GIF drawn onto a ``<canvas>``,
  because a browser cannot pause a GIF.
* **Playing** shows an ``<img>`` of the GIF on top of the canvas. A GIF only
  restarts from its first frame when the browser sees a new address, so each
  play uses a fresh object URL made from a copy fetched once (on a website), or
  a ``?play=`` query (when opened from a folder as ``file://``).
* **Travelling** (``move=``) animates the picture's ``left`` and ``top`` with the
  Web Animations API: out to the edge, a jump to the opposite edge, and back to its
  ``x`` (``top`` for ``up``/``down``). For ``wave-`` and ``hop-`` the keyframes are
  sampled along the path, with the height worked out from the distance travelled;
  ``jump`` is a sampled arc that also rotates the picture. It runs once in ``once``
  mode and repeats in ``toggle`` and ``hover``.
* **Themes** are applied in ``gifscene.js``: the directive passes on only the
  ``:title:``, ``:effect:``, ``:icon:`` and ``:message:`` it was given, and the
  rest come from the theme's defaults. The colours are the ``--gs-*`` CSS
  variables, which the ``gs-christmas`` and ``gs-beach`` classes change.
* **The student kit** loads the same ``gifscene.js`` and ``gifscene.css``. In
  place of the JSON block it reads the ``myGifs`` list and the other settings
  from ``my_scene.js`` and draws into ``<div data-gifscene-kit>``. The kit
  settings are ``sceneTitle``, ``sceneBackground``, ``sceneTheme``, ``myGifs``,
  ``playMode``, ``sceneEffect``, ``startEffect``, ``playSound``, ``finishIcon``
  and ``finishMessage``. Any that are left out come from the theme. If
  ``my_scene.js`` has a mistake that stops it loading, the page says so in plain
  words.

Build warnings are given for a file that cannot be found, a GIF with only one
frame, a file that is not a GIF, and a setting that is not understood.


Updating the student kit
~~~~~~~~~~~~~~~~~~~~~~~~

The kit zips (``christmas/christmas_kit/christmas_student_kit.zip`` and
``christmas/beach_kit/beach_student_kit.zip`` in PC-MultiMedia) each hold their own copy
of ``gifscene.js`` and ``gifscene.css`` in their ``engine`` folder. After changing
either file in ``_ext/gifscene/_static``, copy them into each kit and zip it again.

The kit also holds the Photoshop resources: ``photoshop_frames`` (the star frames,
a plain tree, and a folder of numbered frames for each of the other GIFs,
including the six that travel) and ``photoshop_parts`` (the bell, bauble, present,
candle, snowman and gingerbread as separate pieces).
