=============================
Stringybark Forest Food Web
=============================

A food web joins all the food chains in a community together. Each arrow
points from the food to the organism that eats it, so the arrows show which
way the energy goes.

Each web below starts as empty boxes joined by arrows. Drag each picture
from the tray into the right box, then press **Check**. The arrows are the
clues: look at what goes into and out of each box.

**Explore** shows the finished web: point at (or tap) an organism to see
what it eats and what eats it. **Trace a chain** builds a food chain by
tapping the organisms in order.

The whole forest
================

The three producers and the wedge-tailed eagle are already in place
(``:given:``). The table under the web says what each organism eats, and
picking up a picture shows what that one eats. Notes in brackets, like
``Native cherry (fruit)``, appear in the clues.

.. code-block:: rst

   .. foodweb:: Stringybark forest food web
      :images: Stringybark_forest/{name}.png
      :theme: forest
      :given: Native grass, Native cherry, Brown stringybark, Wedge-tailed eagle

      Click beetle eats Native grass (roots), Native cherry (nectar), Brown stringybark (leaves)
      Snail eats Native grass
      Scale insect eats Brown stringybark (sap)
      Termite eats Brown stringybark (wood)
      Ring-tailed possum eats Brown stringybark (leaves, flowers), Native cherry (fruit)
      Meat ant eats Native grass (seeds), Native cherry, Brown stringybark (nectar), Click beetle, Termite
      Honeyeater eats Native cherry (fruit), Brown stringybark (nectar), Scale insect
      Dunnart eats Click beetle, Termite, Wolf spider
      Skink eats Meat ant (winged ants), Termite
      Wolf spider eats Click beetle, Meat ant, Termite
      Thornbill eats Scale insect, Click beetle
      Magpie eats Snail, Click beetle, Skink
      Brown snake eats Dunnart, Skink, Honeyeater (eggs, chicks), Thornbill (eggs, chicks), Magpie (eggs, chicks)
      Quoll eats Dunnart, Ring-tailed possum, Click beetle, Honeyeater, Thornbill, Magpie
      Wedge-tailed eagle eats Ring-tailed possum, Brown snake

.. foodweb:: Stringybark forest food web
   :images: Stringybark_forest/{name}.png
   :theme: forest
   :given: Native grass, Native cherry, Brown stringybark, Wedge-tailed eagle

   Click beetle eats Native grass (roots), Native cherry (nectar), Brown stringybark (leaves)
   Snail eats Native grass
   Scale insect eats Brown stringybark (sap)
   Termite eats Brown stringybark (wood)
   Ring-tailed possum eats Brown stringybark (leaves, flowers), Native cherry (fruit)
   Meat ant eats Native grass (seeds), Native cherry, Brown stringybark (nectar), Click beetle, Termite
   Honeyeater eats Native cherry (fruit), Brown stringybark (nectar), Scale insect
   Dunnart eats Click beetle, Termite, Wolf spider
   Skink eats Meat ant (winged ants), Termite
   Wolf spider eats Click beetle, Meat ant, Termite
   Thornbill eats Scale insect, Click beetle
   Magpie eats Snail, Click beetle, Skink
   Brown snake eats Dunnart, Skink, Honeyeater (eggs, chicks), Thornbill (eggs, chicks), Magpie (eggs, chicks)
   Quoll eats Dunnart, Ring-tailed possum, Click beetle, Honeyeater, Thornbill, Magpie
   Wedge-tailed eagle eats Ring-tailed possum, Brown snake

What does it eat?
=================

There's no table this time (``:clues: selected``). Tap a picture (or
point at it, or start dragging it) and the box at the top of the tray says
what that organism eats.

.. code-block:: rst

   .. foodweb:: Tap a picture to see what it eats
      :images: Stringybark_forest/{name}.png
      :theme: forest
      :clues: selected

      Click beetle eats Native grass (roots), Native cherry (nectar)
      Snail eats Native grass
      Ring-tailed possum eats Native cherry (fruit)
      Honeyeater eats Native cherry (fruit)
      Magpie eats Snail, Click beetle
      Dunnart eats Click beetle
      Brown snake eats Dunnart, Magpie (eggs, chicks), Honeyeater (eggs, chicks)
      Quoll eats Dunnart, Ring-tailed possum, Honeyeater, Magpie
      Wedge-tailed eagle eats Ring-tailed possum, Brown snake

.. foodweb:: Tap a picture to see what it eats
   :images: Stringybark_forest/{name}.png
   :theme: forest
   :clues: selected

   Click beetle eats Native grass (roots), Native cherry (nectar)
   Snail eats Native grass
   Ring-tailed possum eats Native cherry (fruit)
   Honeyeater eats Native cherry (fruit)
   Magpie eats Snail, Click beetle
   Dunnart eats Click beetle
   Brown snake eats Dunnart, Magpie (eggs, chicks), Honeyeater (eggs, chicks)
   Quoll eats Dunnart, Ring-tailed possum, Honeyeater, Magpie
   Wedge-tailed eagle eats Ring-tailed possum, Brown snake

A smaller web
=============

Chains work too. Every name in one group is eaten by every name in the
next group, so ``Scale insect → Honeyeater, Thornbill`` is two arrows.
Top predators go in the top level with ``:apex: top``.

.. code-block:: rst

   .. foodweb:: Part of the forest
      :images: Stringybark_forest/{name}.png
      :theme: forest
      :apex: top

      Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
      Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
      Honeyeater, Thornbill → Quoll
      Brown stringybark → Termite → Skink → Brown snake

.. foodweb:: Part of the forest
   :images: Stringybark_forest/{name}.png
   :theme: forest
   :apex: top

   Brown stringybark → Scale insect → Honeyeater, Thornbill → Brown snake → Wedge-tailed eagle
   Brown stringybark → Ring-tailed possum → Quoll, Wedge-tailed eagle
   Honeyeater, Thornbill → Quoll
   Brown stringybark → Termite → Skink → Brown snake

Draw the arrows
===============

``:arrows: hidden`` hides the arrows, ready to print for students to draw
them in, and ``:mode: explore`` shows the pictures in place. The
**Arrows** button shows the arrows again.

.. code-block:: rst

   .. foodweb:: Draw the arrows
      :images: Stringybark_forest/{name}.png
      :arrows: hidden
      :mode: explore
      :level-labels: Producers, Herbivores, Carnivores, Top carnivores

      Native grass → Snail, Click beetle
      Native cherry → Click beetle, Ring-tailed possum
      Snail, Click beetle → Magpie
      Click beetle → Dunnart
      Magpie, Dunnart, Ring-tailed possum → Quoll

.. foodweb:: Draw the arrows
   :images: Stringybark_forest/{name}.png
   :arrows: hidden
   :mode: explore
   :level-labels: Producers, Herbivores, Carnivores, Top carnivores

   Native grass → Snail, Click beetle
   Native cherry → Click beetle, Ring-tailed possum
   Snail, Click beetle → Magpie
   Click beetle → Dunnart
   Magpie, Dunnart, Ring-tailed possum → Quoll
