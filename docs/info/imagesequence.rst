Image sequence
==============

The ``imagesequence`` directive gives students a set of pictures, such as
the steps of a science prac, to put into order. Each picture goes into a
numbered box, and arrows between the boxes show the flow.

Students can **drag** a picture into a box, or **tap** a picture and then
tap a box. This works with a mouse, on a touch screen and on the board.
Dropping a picture onto a full box swaps the two pictures. Dragging a
picture back to the tray below takes it out again. The 🔍 button on a
picture shows it full size, so small labels are easy to read.

**🔀 Fill boxes randomly** puts a picture in every box in a random order.
Students then drag pictures between boxes to swap them into the right
order, which is quicker on the board than filling empty boxes one by one.

**✓ Check** marks each picture right or wrong and says how many are in the
right place. **Show answer** puts every picture in the right box, and
**Start again** shuffles them again.

The **🖨 Print** button prints a worksheet. Printing the whole page from
the browser gives the same worksheet. There are two printed versions
(see ``:print:``):

* **worksheet**: a flowchart of small boxes, with the pictures lettered
  A, B, C… underneath. Students write each letter in the right box.
* **cards**: a flowchart of picture-sized boxes, then a page of cut-out
  cards to stick into them.

``:answer-key:`` adds an answer page at the end. The printed pictures are
shuffled the same way every time, so the answer key always matches the
worksheet.

Writing a sequence
------------------

Write the steps **in the right order**. The directive shuffles them for
the students.

.. code-block:: rst

   .. imagesequence:: Making a cup of tea

      .. step:: images/tea/kettle.png

         Boil the kettle

      .. step:: images/tea/teabag.png

         Put a tea bag in the cup

      .. step:: images/tea/pour.png

         Pour in the hot water

Each ``.. step::`` takes the path to a picture, written the same way as
for the ``image`` directive: relative to the page, or starting with ``/``
for a path from the ``docs`` folder. The indented text under a step is its
caption, and normal RST such as ``**bold**`` works in it.

Keyboard: ``Tab`` moves between pictures and boxes, ``Enter`` or
``Space`` picks up a picture and puts it down, ``Esc`` cancels, and ``F``
is full screen.

In full screen (the ⛶ button or ``F``) the whole activity fits on the
screen: the boxes are on the left, sized to fit the screen's height, and
the pictures still to place are in a column on the right. On a narrow
screen it stays as one column that scrolls.

Option reference
----------------

.. list-table::
   :header-rows: 1
   :widths: 18 12 16 54

   * - Option
     - Type
     - Default
     - Description
   * - *(title)*
     - string
     - *None*
     - Optional heading, written after ``.. imagesequence::``.
   * - ``:arrows:``
     - string
     - ``snake``
     - How the boxes are joined. ``snake`` zig-zags like a flowchart: left
       to right, down, then right to left. ``snake-up`` zig-zags the same
       way but starts at the bottom and goes up the page. ``right`` gives rows that all
       read left to right. ``down`` gives one column. ``up`` gives one
       column with the first step at the bottom, e.g. a food chain with
       the plant at the bottom. ``none`` has no arrows. Students can
       change it in ⚙ Settings.
   * - ``:numbering:``
     - string
     - ``numbers``
     - Labels on the boxes: ``numbers`` (1, 2, 3), ``letters`` (A, B, C)
       or ``none``. A step's ``:label:`` replaces its number.
   * - ``:captions:``
     - string
     - ``below``
     - ``below`` shows each caption under its picture. ``overlay`` puts
       it on a see-through band across the bottom of the picture, so the
       cards are shorter (printed worksheets still put it underneath).
       ``hidden`` shows pictures only. ``reveal`` hides the captions until the student
       presses Check or Show answer. ``slot`` puts each caption on its
       box instead, so students match the pictures to the descriptions.
   * - ``:columns:``
     - integer
     - ``3``
     - Boxes in each row, from 1 to 6. On a narrow screen there are
       fewer, so the pictures don't get too small. This and the four
       options below can be changed in ⚙ Settings.
   * - ``:fullscreen-columns:``
     - integer
     - same as ``:columns:``
     - Boxes in each row in full screen, from 1 to 8, e.g. ``:columns: 2``
       on the page and ``:fullscreen-columns: 5`` in full screen. Not
       used when ``:arrows:`` is ``down`` or ``up`` (one column).
   * - ``:tray-columns:``
     - integer
     - as many as fit
     - Pictures in each row of the "still to place" area on the page,
       from 1 to 8. Fewer in a row makes each picture bigger. Not used
       on a phone-sized screen.
   * - ``:fullscreen-tray-columns:``
     - integer
     - as many as fit
     - The same in full screen, from 1 to 6, where the pictures still to
       place are in a strip down the right. ``1`` or ``2`` gives big
       pictures (the strip scrolls if they don't all fit).
   * - ``:fullscreen-tray-width:``
     - integer
     - ``24``
     - How wide that strip is in full screen, as a percentage of the
       screen from 15 to 50. Wider makes the pictures to place bigger
       and leaves less room for the boxes.
   * - ``:feedback:``
     - string
     - ``marks``
     - ``marks`` puts a ✓ or ✗ on each picture after Check. ``count``
       only says how many are in the right place, so students have to
       work out which ones are wrong.
   * - ``:fixed:``
     - list of integers
     - *None*
     - Steps that start in their box and can't be moved, as step numbers
       separated by commas (e.g. ``1`` or ``1, 9``). Useful as a starting
       point for students who need help.
   * - ``:theme:``
     - string
     - ``light``
     - ``dark``, ``light`` (default), ``auto``, ``ocean``, ``forest``,
       ``sunset`` or ``contrast``: the same colour themes as
       ``flashcards``, ``flashquiz``, ``crossword``, ``wordsearch`` and
       ``guessword``. Students can change it in Settings.
   * - ``:print:``
     - string
     - ``worksheet``
     - What the Print button gives: ``worksheet``, ``cards`` or ``none``.
   * - ``:answer-key:``
     - flag
     - Off
     - Add an answer page at the end of the printout.
   * - ``:start:``
     - string
     - ``tray``
     - Where the pictures start: ``tray`` (below the boxes, with the boxes
       empty) or ``boxes`` (already in the boxes in a random order, ready
       to swap). Start again uses the same setting. Students can switch
       with the 🔀 Fill boxes randomly button either way.
   * - ``:images:``
     - string
     - *None*
     - For ``.. chains::`` and ``:extras:``: the picture path for each
       name, with ``{name}`` where the name goes. Spaces in the name become
       underscores, e.g. ``Brown snake`` gives ``Brown_snake.png``.
   * - ``:pick:``
     - string
     - ``random``
     - With several chains: ``random`` uses every chain once, in a random
       order, before any repeats. ``order`` goes through them as written.
   * - ``:distractors:``
     - integer
     - ``0``
     - With several chains: add this many pictures that don't belong. They
       come from ``:extras:`` if it is set, otherwise from the other chains.
   * - ``:extras:``
     - list of names
     - *None*
     - Names, separated by commas, of pictures that are never in a chain,
       e.g. ``Fungus, Bacteria, Tick``. Pictures from other chains can
       sometimes fit, so these are safer distractors.
   * - ``:print-chains:``
     - string
     - ``shown``
     - With several chains: ``shown`` prints the chain on screen. ``all``
       prints every chain, with all the answer pages at the end.
   * - ``:next-label:``
     - string
     - ``New chain``
     - Text on the 🎲 button that picks another chain.
   * - ``:labels:``
     - list of strings
     - *None*
     - Labels for the boxes by position, separated by commas, e.g.
       ``Producer, Herbivore, Carnivore``. ``trophic`` gives *Producer,
       1st consumer, 2nd consumer, …* for any length. A step's own
       ``:label:`` still wins, and boxes past the end of the list use the
       normal numbering. Works with or without chains.
   * - ``:clues:``
     - ``none`` / ``selected``
     - ``none``
     - ``selected`` shows a clue box above the pictures. Tapping, dragging
       or pointing at a picture shows its caption there (with its name, for
       pictures made from names). Good with ``:captions: hidden``.
   * - ``:clue-prompt:``
     - string
     - *Tap or point at a picture to read about it.*
     - Text in the clue box before a picture is picked.

Options for each ``.. step::``:

.. list-table::
   :header-rows: 1
   :widths: 18 12 70

   * - Option
     - Type
     - Description
   * - ``:label:``
     - string
     - Text on this step's box instead of its number, e.g. ``Day 1``.
   * - ``:alt:``
     - string
     - Alt text for screen readers. By default the caption is used.
   * - ``:distractor:``
     - flag
     - A picture that doesn't belong. It is mixed in with the others and
       the right answer is to leave it in the tray. Students are told how
       many pictures don't belong.

Several sequences, one at a time
--------------------------------

One activity can hold several sequences. The page shows one at random,
and the **🎲 New chain** button picks another. Every sequence comes up
once before any repeats. A badge under the title, such as *Chain 4 of 9*,
tells the class which one is showing.

Put each sequence in a ``.. chain::`` group. The groups can be different
lengths and can have their own distractors. A name after ``.. chain::`` is
shown in the badge and on the printout, so don't make it give the answer
away.

.. code-block:: rst

   .. imagesequence:: Yeast prac steps
      :next-label: New set

      .. chain:: Set A

         .. step:: /_static/images/yeast/step1.png

            Mark a line 4 cm from the bottom of each tube

         .. step:: /_static/images/yeast/step2.png

            Label the tubes RT and P

      .. chain:: Set B

         .. step:: ...

For food chains, write one chain per line in ``.. chains::``. Each name
finds its picture through ``:images:``, and becomes the caption. Join the
names with ``→`` (or ``->``). A list marker such as ``#.`` at the start of
a line is ignored, so lines can be copied straight from a numbered list.
If a picture is missing, the build gives a warning that names it.

.. code-block:: rst

   .. imagesequence:: Food chain with four organisms
      :images: ../food_webs/Stringybark_forest/{name}.png
      :distractors: 1
      :extras: Fungus, Bacteria, Tick
      :columns: 4
      :arrows: right
      :theme: forest

      .. chains::

         Native grass → Snail → Magpie → Quoll
         Native cherry → Honeyeater → Brown snake → Wedge-tailed eagle
         Brown stringybark → Scale insect → Thornbill → Quoll

.. imagesequence:: Food chain with four organisms
   :images: ../food_webs/Stringybark_forest/{name}.png
   :distractors: 1
   :extras: Fungus, Bacteria, Tick
   :columns: 4
   :arrows: right
   :theme: forest

   .. chains::

      Native grass → Snail → Magpie → Quoll
      Native cherry → Honeyeater → Brown snake → Wedge-tailed eagle
      Brown stringybark → Scale insect → Thornbill → Quoll

Box labels and captions
~~~~~~~~~~~~~~~~~~~~~~~

``:labels: trophic`` labels the boxes *Producer*, *1st consumer*,
*2nd consumer* and so on, whatever the length of the chain.

The caption under each picture from ``.. chains::`` or ``:extras:`` is its
name. To write your own, add a ``.. captions::`` block with one
``Name: caption`` line per picture. Normal RST such as ``**bold**`` works,
and the block can go before or after ``.. chains::``. Pictures not in the
block keep their name as the caption. If a name in the block isn't in any
chain, the build gives a warning, which catches spelling mistakes.

.. code-block:: rst

   .. imagesequence:: Food chain
      :images: ../food_webs/Stringybark_forest/{name}.png
      :labels: trophic

      .. captions::

         Native grass: Makes its own food from sunlight
         Snail: Eats grass
         Magpie: Eats snails, beetles and skinks
         Quoll: Eats possums, dunnarts, birds and beetles

      .. chains::

         Native grass → Snail → Magpie → Quoll

With ``:captions: slot`` the captions go on the boxes, and students match
each picture to its description. Leave the name out of these captions,
or they give the answer away.

.. code-block:: rst

   .. imagesequence:: Match the organisms to the descriptions
      :images: ../food_webs/Stringybark_forest/{name}.png
      :labels: trophic
      :captions: slot
      :columns: 4
      :arrows: right
      :theme: forest

      .. captions::

         Native grass: Makes its own food from sunlight
         Native cherry: Makes its own food from sunlight
         Brown stringybark: Makes its own food from sunlight
         Snail: Eats grass
         Scale insect: Sucks sap from twigs and leaves
         Honeyeater: Eats nectar, fruit and scale insects
         Thornbill: Eats scale insects and beetles
         Magpie: Eats snails, beetles and skinks
         Brown snake: Eats small mammals, skinks, and birds' eggs and chicks
         Quoll: Eats possums, dunnarts, birds and beetles
         Wedge-tailed eagle: Eats possums and snakes

      .. chains::

         Native grass → Snail → Magpie → Quoll
         Native cherry → Honeyeater → Brown snake → Wedge-tailed eagle
         Brown stringybark → Scale insect → Thornbill → Quoll

.. imagesequence:: Match the organisms to the descriptions
   :images: ../food_webs/Stringybark_forest/{name}.png
   :labels: trophic
   :captions: slot
   :columns: 4
   :arrows: right
   :theme: forest

   .. captions::

      Native grass: Makes its own food from sunlight
      Native cherry: Makes its own food from sunlight
      Brown stringybark: Makes its own food from sunlight
      Snail: Eats grass
      Scale insect: Sucks sap from twigs and leaves
      Honeyeater: Eats nectar, fruit and scale insects
      Thornbill: Eats scale insects and beetles
      Magpie: Eats snails, beetles and skinks
      Brown snake: Eats small mammals, skinks, and birds' eggs and chicks
      Quoll: Eats possums, dunnarts, birds and beetles
      Wedge-tailed eagle: Eats possums and snakes

   .. chains::

      Native grass → Snail → Magpie → Quoll
      Native cherry → Honeyeater → Brown snake → Wedge-tailed eagle
      Brown stringybark → Scale insect → Thornbill → Quoll

``:fixed:`` works with chains too, e.g. ``:fixed: 1`` to give the
producer. Every food chain on the
:doc:`Stringybark forest page <../food_webs/stringybark_food_chains>` is
used in its random examples, one activity for each chain length.

Each example below shows the RST first, then the activity it makes. The
pictures are from the yeast and temperature prac.

Basic sequence
--------------

Nine steps with the default snake arrows and captions under the pictures.
The printout has an answer page.

.. code-block:: rst

   .. imagesequence:: Yeast and temperature: method
      :answer-key:

      .. step:: images/prac2/yeast_Step1.png

         Mark a line 4 cm from the bottom of two test tubes

      .. step:: images/prac2/yeast_Step2.png

         Label the tubes **RT** (room temperature) and **P** (palm)

      .. step:: images/prac2/yeast_Step3.png

         Pour 50 mL of water onto 10 g of yeast and 5 g of sugar

      .. step:: images/prac2/yeast_Step4.png

         Stir until the mixture is smooth

      .. step:: images/prac2/yeast_Step5.png

         Carefully fill each tube up to the line

      .. step:: images/prac2/yeast_Step6.png

         Leave tube RT in the rack on the bench

      .. step:: images/prac2/yeast_Step7.png

         Hold tube P still in your palm. Don't shake it!

      .. step:: images/prac2/yeast_Step8.png

         Start the timer. Measure the height every 3 minutes for 15 minutes

      .. step:: images/prac2/yeast_Step9.png

         Tip out into the sink, rinse with water and return the equipment

.. imagesequence:: Yeast and temperature: method
   :answer-key:

   .. step:: images/prac2/yeast_Step1.png

      Mark a line 4 cm from the bottom of two test tubes

   .. step:: images/prac2/yeast_Step2.png

      Label the tubes **RT** (room temperature) and **P** (palm)

   .. step:: images/prac2/yeast_Step3.png

      Pour 50 mL of water onto 10 g of yeast and 5 g of sugar

   .. step:: images/prac2/yeast_Step4.png

      Stir until the mixture is smooth

   .. step:: images/prac2/yeast_Step5.png

      Carefully fill each tube up to the line

   .. step:: images/prac2/yeast_Step6.png

      Leave tube RT in the rack on the bench

   .. step:: images/prac2/yeast_Step7.png

      Hold tube P still in your palm. Don't shake it!

   .. step:: images/prac2/yeast_Step8.png

      Start the timer. Measure the height every 3 minutes for 15 minutes

   .. step:: images/prac2/yeast_Step9.png

      Tip out into the sink, rinse with water and return the equipment

Pictures only, with a starting point
------------------------------------

``:captions: hidden`` makes students read the pictures themselves.
``:fixed: 1`` puts step 1 in its box to start them off, and
``:feedback: count`` doesn't show which pictures are wrong. The arrows are
in rows of four, and the printout is cut-out cards.

.. code-block:: rst

   .. imagesequence:: Yeast prac: pictures only
      :captions: hidden
      :fixed: 1
      :feedback: count
      :arrows: right
      :columns: 4
      :print: cards
      :theme: ocean

      .. step:: images/prac2/yeast_Step1.png

         Mark a line 4 cm from the bottom of two test tubes

      .. step:: images/prac2/yeast_Step2.png

         Label the tubes RT and P

      .. step:: images/prac2/yeast_Step3.png

         Pour 50 mL of water onto the yeast and sugar

      .. step:: images/prac2/yeast_Step4.png

         Stir until smooth

      .. step:: images/prac2/yeast_Step5.png

         Fill each tube to the line

      .. step:: images/prac2/yeast_Step6.png

         Leave tube RT on the bench

      .. step:: images/prac2/yeast_Step7.png

         Hold tube P in your palm

      .. step:: images/prac2/yeast_Step8.png

         Measure the height every 3 minutes

.. imagesequence:: Yeast prac: pictures only
   :captions: hidden
   :fixed: 1
   :feedback: count
   :arrows: right
   :columns: 4
   :print: cards
   :theme: ocean

   .. step:: images/prac2/yeast_Step1.png

      Mark a line 4 cm from the bottom of two test tubes

   .. step:: images/prac2/yeast_Step2.png

      Label the tubes RT and P

   .. step:: images/prac2/yeast_Step3.png

      Pour 50 mL of water onto the yeast and sugar

   .. step:: images/prac2/yeast_Step4.png

      Stir until smooth

   .. step:: images/prac2/yeast_Step5.png

      Fill each tube to the line

   .. step:: images/prac2/yeast_Step6.png

      Leave tube RT on the bench

   .. step:: images/prac2/yeast_Step7.png

      Hold tube P in your palm

   .. step:: images/prac2/yeast_Step8.png

      Measure the height every 3 minutes

The captions are still written in, so they appear on the answer page and
in the alt text for screen readers.

Matching pictures to descriptions
---------------------------------

With ``:captions: slot`` the descriptions are printed on the boxes, and
students match each picture to its description. These boxes use letters,
and the steps go down the page in one column.

.. code-block:: rst

   .. imagesequence:: Setting up the tubes
      :captions: slot
      :numbering: letters
      :arrows: down
      :theme: forest

      .. step:: images/prac2/yeast_Step1.png

         Mark a line 4 cm from the bottom of two test tubes

      .. step:: images/prac2/yeast_Step2.png

         Label the tubes RT and P near the top

      .. step:: images/prac2/yeast_Step5.png

         Fill each tube up to the line with the yeast mixture

.. imagesequence:: Setting up the tubes
   :captions: slot
   :numbering: letters
   :arrows: down
   :theme: forest

   .. step:: images/prac2/yeast_Step1.png

      Mark a line 4 cm from the bottom of two test tubes

   .. step:: images/prac2/yeast_Step2.png

      Label the tubes RT and P near the top

   .. step:: images/prac2/yeast_Step5.png

      Fill each tube up to the line with the yeast mixture

Labels and a distractor
-----------------------

Each box here has its own ``:label:`` instead of a number. The last
picture is a ``:distractor:``: it belongs to a different part of the prac,
so the right answer is to leave it in the tray. Reveal captions stay
hidden until the student presses Check.

.. code-block:: rst

   .. imagesequence:: Making the yeast mixture
      :captions: reveal
      :arrows: right
      :theme: sunset

      .. step:: images/prac2/yeast_Step3.png
         :label: Measure

         Pour 50 mL of water onto 10 g of yeast and 5 g of sugar

      .. step:: images/prac2/yeast_Step4.png
         :label: Mix

         Stir until the mixture is smooth

      .. step:: images/prac2/yeast_Step5.png
         :label: Pour

         Fill each tube up to the line

      .. step:: images/prac2/yeast_Step9.png
         :distractor:

         Tip out into the sink (this is cleaning up, not making the mixture)

.. imagesequence:: Making the yeast mixture
   :captions: reveal
   :arrows: right
   :theme: sunset

   .. step:: images/prac2/yeast_Step3.png
      :label: Measure

      Pour 50 mL of water onto 10 g of yeast and 5 g of sugar

   .. step:: images/prac2/yeast_Step4.png
      :label: Mix

      Stir until the mixture is smooth

   .. step:: images/prac2/yeast_Step5.png
      :label: Pour

      Fill each tube up to the line

   .. step:: images/prac2/yeast_Step9.png
      :distractor:

      Tip out into the sink (this is cleaning up, not making the mixture)

Starting with the pictures in the boxes
---------------------------------------

``:start: boxes`` puts the pictures in the boxes in a random order, so
students only have to swap them. This suits a quick starter on the board.

.. code-block:: rst

   .. imagesequence:: Measuring and cleaning up
      :start: boxes
      :columns: 4
      :theme: dark

      .. step:: images/prac2/yeast_Step6.png

         Leave tube RT in the rack on the bench

      .. step:: images/prac2/yeast_Step7.png

         Hold tube P still in your palm. Don't shake it!

      .. step:: images/prac2/yeast_Step8.png

         Start the timer. Measure the height every 3 minutes for 15 minutes

      .. step:: images/prac2/yeast_Step9.png

         Tip out into the sink, rinse with water and return the equipment

.. imagesequence:: Measuring and cleaning up
   :start: boxes
   :columns: 4
   :theme: dark

   .. step:: images/prac2/yeast_Step6.png

      Leave tube RT in the rack on the bench

   .. step:: images/prac2/yeast_Step7.png

      Hold tube P still in your palm. Don't shake it!

   .. step:: images/prac2/yeast_Step8.png

      Start the timer. Measure the height every 3 minutes for 15 minutes

   .. step:: images/prac2/yeast_Step9.png

      Tip out into the sink, rinse with water and return the equipment

Going up the page
-----------------

``:arrows: up`` puts the first step at the bottom and the arrows point up.
This suits a food chain, where energy passes up from the plant. Write the
steps in order as usual, starting with the plant. ``:arrows: snake-up``
does the same with rows: it starts at the bottom left and zig-zags up,
which suits a longer chain.

.. code-block:: rst

   .. imagesequence:: Grass to quoll
      :arrows: up
      :theme: forest

      .. step:: /food_webs/Stringybark_forest/Native_grass.png
         :label: Producer

         Native grass

      .. step:: /food_webs/Stringybark_forest/Snail.png

         Snail

      .. step:: /food_webs/Stringybark_forest/Magpie.png

         Magpie

      .. step:: /food_webs/Stringybark_forest/Quoll.png

         Quoll

.. imagesequence:: Grass to quoll
   :arrows: up
   :theme: forest

   .. step:: /food_webs/Stringybark_forest/Native_grass.png
      :label: Producer

      Native grass

   .. step:: /food_webs/Stringybark_forest/Snail.png

      Snail

   .. step:: /food_webs/Stringybark_forest/Magpie.png

      Magpie

   .. step:: /food_webs/Stringybark_forest/Quoll.png

      Quoll

Captions on the pictures
------------------------

``:captions: overlay`` writes each caption on a see-through band across
the bottom of its picture instead of underneath it, so the cards are
shorter. It suits short captions such as names. Students can also pick
*On the pictures* in the ⚙ settings.

.. code-block:: rst

   .. imagesequence:: Names on the pictures
      :images: ../food_webs/Stringybark_forest/{name}.png
      :captions: overlay
      :labels: trophic
      :columns: 4
      :arrows: right
      :theme: forest

      .. chains::

         Native grass → Snail → Magpie → Quoll
         Native cherry → Honeyeater → Brown snake → Wedge-tailed eagle
         Brown stringybark → Termite → Dunnart → Quoll

.. imagesequence:: Names on the pictures
   :images: ../food_webs/Stringybark_forest/{name}.png
   :captions: overlay
   :labels: trophic
   :columns: 4
   :arrows: right
   :theme: forest

   .. chains::

      Native grass → Snail → Magpie → Quoll
      Native cherry → Honeyeater → Brown snake → Wedge-tailed eagle
      Brown stringybark → Termite → Dunnart → Quoll

Clue box
--------

``:clues: selected`` adds a box above the pictures. When a student taps a
picture, starts dragging it or points at it, the box shows that picture's
caption. With ``:captions: hidden`` the captions aren't under the pictures,
so the clue box is the only place to read them. For pictures made from
names (``.. chains::``), the name is shown first, then the caption from the
``.. captions::`` block.

.. code-block:: rst

   .. imagesequence:: What does each one eat?
      :captions: hidden
      :clues: selected
      :clue-prompt: Tap a picture to see what it eats.
      :columns: 4
      :arrows: right
      :theme: forest

      .. step:: /food_webs/Stringybark_forest/Native_grass.png

         **Native grass** makes its own food from sunlight

      .. step:: /food_webs/Stringybark_forest/Snail.png

         **Snail** eats grass

      .. step:: /food_webs/Stringybark_forest/Magpie.png

         **Magpie** eats snails

      .. step:: /food_webs/Stringybark_forest/Quoll.png

         **Quoll** eats magpies

.. imagesequence:: What does each one eat?
   :captions: hidden
   :clues: selected
   :clue-prompt: Tap a picture to see what it eats.
   :columns: 4
   :arrows: right
   :theme: forest

   .. step:: /food_webs/Stringybark_forest/Native_grass.png

      **Native grass** makes its own food from sunlight

   .. step:: /food_webs/Stringybark_forest/Snail.png

      **Snail** eats grass

   .. step:: /food_webs/Stringybark_forest/Magpie.png

      **Magpie** eats snails

   .. step:: /food_webs/Stringybark_forest/Quoll.png

      **Quoll** eats magpies

Tips
----

* Pictures that are all the same shape look best. The boxes take their
  shape from the first picture.
* Keep labels inside the pictures large. They are shown quite small in the
  boxes, though students can use 🔍 to read them.
* Four to nine steps works well. With more than that, split the method
  into parts (e.g. setting up, measuring, cleaning up).
* For a long method on phones, ``:arrows: down`` is easiest to read.
