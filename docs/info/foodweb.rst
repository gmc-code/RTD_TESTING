=================
Foodweb
=================

The ``foodweb`` directive draws a food web from a list of who eats whom.
The pictures are put in levels, producers at the bottom, with up to five
pictures in a level and about 2 cm between levels. Each arrow goes from the
food to the organism that eats it. An arrow that skips a level curves
through the gaps between the pictures it passes, so it never goes behind
one.

The main use is a **place the organisms** activity, like putting a food
chain in order. The web is shown as empty boxes joined by arrows, and the
pictures are shuffled in a tray underneath. Students drag each picture into
a box (or tap a picture, then tap a box), using the arrows as clues, and
press **Check**. Right pictures go green and wrong ones red. **Show answer**
fills in the rest and **Start again** shuffles the tray. The tray shrinks as
pictures are placed, so it is only as big as the pictures left in it need.
Two organisms that
eat the same things and are eaten by the same things can swap boxes and
still be marked right.

Students can also switch to:

* **Explore**, which shows the finished web. Point at or tap an organism to
  see what it eats (green arrows) and what eats it (orange arrows).
* **Trace a chain**, to build a food chain by tapping the organisms in
  order. A wrong tap is pointed out, and **Hint** shows what could come
  next.

In Explore and Trace a chain the pictures can be dragged to a new spot. The
arrows are redrawn as a picture moves: straight when nothing is in the way,
curving through the gaps when a picture blocks them. When you let go, the
picture settles into the nearest level. **Reset layout** puts everything
back. With the keyboard, the arrow keys move the selected picture (Shift
for bigger steps). **Copy layout** copies where every picture is, so a
layout you like can be saved in the page (see *Saving a layout* below).

The arrows or the names can be hidden, and the web can be printed (with the
tray, as a cut-and-paste sheet) or shown full screen.

The layout is worked out when the docs are built, so the web prints the
same as it looks.


Options
=======

.. list-table::
   :header-rows: 1
   :widths: 22 78

   * - Option
     - What it does
   * - ``:images:``
     - picture path with ``{name}`` in it
   * - ``:theme:``
     - ``light`` (default), ``dark``, ``auto``, ``ocean``, ``forest``,
       ``sunset`` or ``contrast``
   * - ``:width:``
     - width of each picture box in px (default 140)
   * - ``:gap:``
     - space between levels in cm (default 2)
   * - ``:max-per-level:``
     - most pictures in one level, 2 to 8 (default 5)
   * - ``:apex:``
     - ``top`` puts every organism that nothing eats in the top level.
       ``auto`` (default) puts them one level above their food.
   * - ``:level-labels:``
     - labels down the left side, **bottom level first**, separated by
       commas, e.g. ``Producers, Herbivores, Carnivores``. ``trophic``
       gives *Producers, 1st consumers, 2nd consumers* and so on.
   * - ``:arrows:``
     - ``shown`` (default) or ``hidden``, e.g. to print a sheet for
       students to draw the arrows on
   * - ``:names:``
     - ``below`` (default) puts each name under its picture. ``overlay``
       puts it on a see-through band across the bottom of the picture, so
       the boxes are shorter and the web takes less room. ``hidden`` shows
       no names. See *Names on the pictures* below.
   * - ``:mode:``
     - the mode the web starts in: ``place`` (default), ``explore`` or
       ``trace``. Students can still switch.
   * - ``:given:``
     - names of pictures that start in their boxes (and can't be moved),
       e.g. ``Native grass, Wedge-tailed eagle``
   * - ``:clues:``
     - what students are told about each organism's food while placing:
       ``both`` (default), ``table``, ``selected`` or ``none``. See
       *Clues* below.
   * - ``:straighten:``
     - ``yes`` (default) slides pictures sideways, swaps neighbours and may
       widen the web a little, so that as many arrows as possible are
       straight. ``no`` spaces the pictures in each level evenly.

----

Example
=======

.. code-block:: rst

   .. foodweb:: Part of the forest
      :images: ../food_webs/Stringybark_forest/{name}.png
      :theme: forest

      Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
      Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
      Honeyeater, Thornbill → Quoll
      Brown stringybark → Termite → Skink → Brown snake

.. foodweb:: Part of the forest
   :images: ../food_webs/Stringybark_forest/{name}.png
   :theme: forest

   Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
   Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
   Honeyeater, Thornbill → Quoll
   Brown stringybark → Termite → Skink → Brown snake

The whole stringybark forest web is on the
:doc:`../food_webs/stringybark_food_web` page.

Writing the links
=================

Each line inside the directive is one of these:

.. list-table::
   :header-rows: 1
   :widths: 45 55

   * - Line
     - Meaning
   * - ``Magpie eats Snail, Click beetle, Skink``
     - three arrows into Magpie (the same as the *Eats* column of a table)
   * - ``Native grass → Snail → Magpie``
     - a food chain. ``->`` works too.
   * - ``Scale insect → Honeyeater, Thornbill``
     - every name in one group is eaten by every name in the next group,
       so this is two arrows
   * - ``Snail is eaten by Magpie``
     - one arrow into Magpie
   * - ``Fungus``
     - an organism on its own, with no arrows

Names match whatever the case, and anything in brackets is ignored, so
``Native cherry (fruit)`` is the same as ``Native cherry``. A link written
twice is only drawn once.

Clues
-----

To place the pictures, students need to know what each organism eats.

* ``:clues: table`` shows a table under the web of what each organism
  eats, with a small picture of each, in alphabetical order. It prints with
  the web.
* ``:clues: selected`` says what a picture eats when it's picked up,
  dragged or pointed at.
* ``:clues: both`` (default) does both. ``:clues: none`` gives no clues.

Students can change this with the ⚙ settings button.

The clue text comes from the links. A note in brackets is kept in the
clue (but ignored when matching names), so

.. code-block:: rst

   Honeyeater eats Native cherry (fruit), Brown stringybark (nectar), Scale insect

gives *Honeyeater eats Native cherry (fruit), Brown stringybark (nectar)
and Scale insect*. Organisms that eat nothing in the web are shown as
producers.

Table of what each organism eats
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: rst

   .. foodweb:: Clues in a table
      :images: ../food_webs/Stringybark_forest/{name}.png
      :clues: table

      Snail eats Native grass
      Click beetle eats Native grass (roots), Native cherry (nectar)
      Ring-tailed possum eats Native cherry (fruit)
      Magpie eats Snail, Click beetle
      Quoll eats Magpie, Ring-tailed possum, Click beetle

.. foodweb:: Clues in a table
   :images: ../food_webs/Stringybark_forest/{name}.png
   :clues: table

   Snail eats Native grass
   Click beetle eats Native grass (roots), Native cherry (nectar)
   Ring-tailed possum eats Native cherry (fruit)
   Magpie eats Snail, Click beetle
   Quoll eats Magpie, Ring-tailed possum, Click beetle

What the picked-up picture eats
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

No table: pick up, drag or point at a picture to see what it eats.

.. code-block:: rst

   .. foodweb:: Clue for the picked-up picture
      :images: ../food_webs/Stringybark_forest/{name}.png
      :clues: selected

      Snail eats Native grass
      Click beetle eats Native grass (roots), Native cherry (nectar)
      Ring-tailed possum eats Native cherry (fruit)
      Magpie eats Snail, Click beetle
      Quoll eats Magpie, Ring-tailed possum, Click beetle

.. foodweb:: Clue for the picked-up picture
   :images: ../food_webs/Stringybark_forest/{name}.png
   :clues: selected

   Snail eats Native grass
   Click beetle eats Native grass (roots), Native cherry (nectar)
   Ring-tailed possum eats Native cherry (fruit)
   Magpie eats Snail, Click beetle
   Quoll eats Magpie, Ring-tailed possum, Click beetle

Your own clue text
^^^^^^^^^^^^^^^^^^

To write your own clue for some organisms, add a ``.. clues::`` block with
``Name: text`` lines. The others keep the clue made from the links.

.. code-block:: rst

   .. foodweb:: Grassland
      :images: ../food_webs/Stringybark_forest/{name}.png

      Native grass → Snail, Click beetle → Magpie → Quoll

      .. clues::

         Snail: grass, using its rough tongue
         Magpie: snails and beetles it finds in the grass

.. foodweb:: Grassland
   :images: ../food_webs/Stringybark_forest/{name}.png

   Native grass → Snail, Click beetle → Magpie → Quoll

   .. clues::

      Snail: grass, using its rough tongue
      Magpie: snails and beetles it finds in the grass

Pictures
--------

``:images:`` is the picture path with ``{name}`` in it. ``{name}`` is the
organism's name with spaces changed to underscores, the same as the
imagesequence directive, so ``Ring-tailed possum`` uses
``Ring-tailed_possum.png``. Without ``:images:`` each organism is a box with
its name in it. A missing picture gives a build warning.

Levels
======

Each organism goes one level above the highest thing it eats, so every
arrow points up. If a level would have more than ``:max-per-level:``
pictures (5 unless you change it), some move up a level, starting with the
ones that have room above them.

Inside a level, the pictures are put in the order that gives the fewest
crossing arrows. Then they are slid sideways (and neighbours swapped) so
that as many arrows as possible are straight lines. An arrow only curves
through the gaps when a picture is in the way.

This doesn't always find the best layout. When it doesn't, drag the
pictures yourself and save the result (see *Saving a layout* below).

Choosing the levels yourself
----------------------------

Add a ``.. levels::`` block. Write the levels **top to bottom**, as they
look on the page. The order in each line is the order across the page.

.. code-block:: rst

   .. foodweb:: Grassland
      :images: ../food_webs/Stringybark_forest/{name}.png

      Native grass → Snail, Click beetle
      Snail, Click beetle → Magpie
      Click beetle → Dunnart
      Magpie, Dunnart → Quoll

      .. levels::

         Quoll
         Magpie, Dunnart
         Snail, Click beetle
         Native grass

.. foodweb:: Grassland
   :images: ../food_webs/Stringybark_forest/{name}.png

   Native grass → Snail, Click beetle
   Snail, Click beetle → Magpie
   Click beetle → Dunnart
   Magpie, Dunnart → Quoll

   .. levels::

      Quoll
      Magpie, Dunnart
      Snail, Click beetle
      Native grass

An arrow that ends up pointing down or sideways (because of the levels you
chose) is drawn dashed.

Saving a layout
---------------

If the automatic layout leaves arrows curving that could be straight, set
the web out yourself and save it in the page:

#. Build the docs and open the page.
#. Switch to **Explore** (or **Trace a chain**) and drag the pictures until
   you are happy with them. A picture can be dragged to another level too.
#. Press **📋 Copy layout**. A box opens with a ``.. levels::`` block and a
   ``.. positions::`` block, and they are copied for you. (If your browser
   doesn't allow copying, select the text in the box and copy it.)
#. Paste it into the directive in place of its ``.. levels::`` block (and
   any old ``.. positions::`` block), then build again.

Each line of ``.. positions::`` is ``Name: number``. The number is how far
the middle of the picture is from the left edge of the web, in pixels, so
you can also nudge one picture by changing its number. A picture with a
saved position stays exactly there. Any picture without one is placed as
usual, but it may then overlap a saved one, so it's best to save them all
(**Copy layout** always does).

Saved positions suit the ``:width:`` they were made with. If you change
``:width:``, set the web out again and copy a new layout.

This is the web above with the quoll moved over the dunnart and the grass
under the snail:

.. code-block:: rst

   .. foodweb:: Grassland, saved layout
      :images: ../food_webs/Stringybark_forest/{name}.png
      :mode: explore

      Native grass → Snail, Click beetle
      Snail, Click beetle → Magpie
      Click beetle → Dunnart
      Magpie, Dunnart → Quoll

      .. levels::

         Quoll
         Magpie, Dunnart
         Snail, Click beetle
         Native grass

      .. positions::

         Quoll: 626
         Magpie: 278
         Dunnart: 626
         Snail: 278
         Click beetle: 626
         Native grass: 278

.. foodweb:: Grassland, saved layout
   :images: ../food_webs/Stringybark_forest/{name}.png
   :mode: explore

   Native grass → Snail, Click beetle
   Snail, Click beetle → Magpie
   Click beetle → Dunnart
   Magpie, Dunnart → Quoll

   .. levels::

      Quoll
      Magpie, Dunnart
      Snail, Click beetle
      Native grass

   .. positions::

      Quoll: 626
      Magpie: 278
      Dunnart: 626
      Snail: 278
      Click beetle: 626
      Native grass: 278

The :doc:`../food_webs/australian_desert_food_web` page uses a saved
layout.

Draw the arrows worksheet
-------------------------

.. code-block:: rst

   .. foodweb:: Draw the arrows
      :images: ../food_webs/Stringybark_forest/{name}.png
      :arrows: hidden
      :mode: explore
      :level-labels: Producers, Herbivores, Carnivores, Top carnivores

      Native grass → Snail, Click beetle
      Native cherry → Click beetle, Ring-tailed possum
      Snail, Click beetle → Magpie
      Click beetle → Dunnart
      Magpie, Dunnart, Ring-tailed possum → Quoll

.. foodweb:: Draw the arrows
   :images: ../food_webs/Stringybark_forest/{name}.png
   :arrows: hidden
   :mode: explore
   :level-labels: Producers, Herbivores, Carnivores, Top carnivores

   Native grass → Snail, Click beetle
   Native cherry → Click beetle, Ring-tailed possum
   Snail, Click beetle → Magpie
   Click beetle → Dunnart
   Magpie, Dunnart, Ring-tailed possum → Quoll

The print button prints the web as it looks at the time, so hide the
arrows (or highlight an organism) first if you want that on the sheet.

More examples
=============

Pictures already in place
-------------------------

``:given:`` puts some pictures in their boxes at the start. They can't be
moved, and they aren't in the tray. Giving the producers, or the top
predator, is a good way to make a big web easier.

.. code-block:: rst

   .. foodweb:: Two pictures given
      :images: ../food_webs/Stringybark_forest/{name}.png
      :given: Native grass, Native cherry
      :clues: table

      Snail eats Native grass
      Click beetle eats Native grass (roots), Native cherry (nectar)
      Ring-tailed possum eats Native cherry (fruit)
      Magpie eats Snail, Click beetle
      Quoll eats Magpie, Ring-tailed possum, Click beetle

.. foodweb:: Two pictures given
   :images: ../food_webs/Stringybark_forest/{name}.png
   :given: Native grass, Native cherry
   :clues: table

   Snail eats Native grass
   Click beetle eats Native grass (roots), Native cherry (nectar)
   Ring-tailed possum eats Native cherry (fruit)
   Magpie eats Snail, Click beetle
   Quoll eats Magpie, Ring-tailed possum, Click beetle

Top predators at the top
------------------------

By default each organism goes one level above the highest thing it eats,
so the quoll (which eats a click beetle) sits low down. ``:apex: top``
puts every organism that nothing eats in the top level. These two use
``:mode: explore`` so the pictures are shown in place.

Default (``:apex: auto``):

.. code-block:: rst

   .. foodweb:: Apex auto
      :images: ../food_webs/Stringybark_forest/{name}.png
      :mode: explore

      Native grass → Snail → Magpie → Brown snake → Wedge-tailed eagle
      Native grass → Click beetle → Quoll
      Native cherry → Ring-tailed possum → Wedge-tailed eagle

.. foodweb:: Apex auto
   :images: ../food_webs/Stringybark_forest/{name}.png
   :mode: explore

   Native grass → Snail → Magpie → Brown snake → Wedge-tailed eagle
   Native grass → Click beetle → Quoll
   Native cherry → Ring-tailed possum → Wedge-tailed eagle

With ``:apex: top``:

.. code-block:: rst

   .. foodweb:: Apex top
      :images: ../food_webs/Stringybark_forest/{name}.png
      :apex: top
      :mode: explore

      Native grass → Snail → Magpie → Brown snake → Wedge-tailed eagle
      Native grass → Click beetle → Quoll
      Native cherry → Ring-tailed possum → Wedge-tailed eagle

.. foodweb:: Apex top
   :images: ../food_webs/Stringybark_forest/{name}.png
   :apex: top
   :mode: explore

   Native grass → Snail → Magpie → Brown snake → Wedge-tailed eagle
   Native grass → Click beetle → Quoll
   Native cherry → Ring-tailed possum → Wedge-tailed eagle

Evenly spaced pictures
----------------------

By default pictures are slid sideways so that as many arrows as possible
are straight. ``:straighten: no`` spaces the pictures in each level evenly
instead, so more arrows curve round the pictures in the way. Compare these
two.

Default (``:straighten: yes``):

.. code-block:: rst

   .. foodweb:: Straightened
      :images: ../food_webs/Stringybark_forest/{name}.png
      :mode: explore

      Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
      Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
      Honeyeater, Thornbill → Quoll
      Brown stringybark → Termite → Skink → Brown snake

.. foodweb:: Straightened
   :images: ../food_webs/Stringybark_forest/{name}.png
   :mode: explore

   Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
   Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
   Honeyeater, Thornbill → Quoll
   Brown stringybark → Termite → Skink → Brown snake

With ``:straighten: no``:

.. code-block:: rst

   .. foodweb:: Evenly spaced
      :images: ../food_webs/Stringybark_forest/{name}.png
      :straighten: no
      :mode: explore

      Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
      Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
      Honeyeater, Thornbill → Quoll
      Brown stringybark → Termite → Skink → Brown snake

.. foodweb:: Evenly spaced
   :images: ../food_webs/Stringybark_forest/{name}.png
   :straighten: no
   :mode: explore

   Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
   Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
   Honeyeater, Thornbill → Quoll
   Brown stringybark → Termite → Skink → Brown snake

Names on the pictures
---------------------

``:names: overlay`` writes each name on a see-through band across the
bottom of its picture instead of underneath it. The boxes are shorter, so
the whole web takes less room. Compare this with *Straightened* above,
which is the same web with the names below.

.. code-block:: rst

   .. foodweb:: Names on the pictures
      :images: ../food_webs/Stringybark_forest/{name}.png
      :names: overlay
      :mode: explore

      Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
      Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
      Honeyeater, Thornbill → Quoll
      Brown stringybark → Termite → Skink → Brown snake

.. foodweb:: Names on the pictures
   :images: ../food_webs/Stringybark_forest/{name}.png
   :names: overlay
   :mode: explore

   Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
   Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
   Honeyeater, Thornbill → Quoll
   Brown stringybark → Termite → Skink → Brown snake
