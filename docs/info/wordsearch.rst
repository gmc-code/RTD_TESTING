Word search
===========

The ``wordsearch`` directive builds a word search when Sphinx runs. Students
find words by dragging across the letters, or by tapping the first letter and
then the last (this suits interactive whiteboards).

Each puzzle has a **🖨 Print** button that prints just that puzzle as a clean,
blank worksheet, with the answer key on a second page if ``:answers: print``
is set. Printing the whole page from the browser also gives blank worksheets.

The **⚙** button opens settings where students can change things that
don't change the puzzle itself:

* **Theme**: any of the colour themes (see ``:theme:`` below).
* **Letter size**: 80% to 160%. Bigger makes the grid wider (when there is
  room) and the letters larger, which helps on a projector or interactive
  whiteboard.
* **Letter highlight**: turn pressing a letter key to highlight it on or off.
* **Reset settings** undoes their changes.

Choices are saved in that browser, separately for each puzzle. Settings
never change the grid or the words, so the screen still matches the printed
worksheet, and printing always uses the normal size and black and white.
Add ``:no-settings:`` to hide the button.

Option reference
----------------

.. list-table::
   :header-rows: 1
   :widths: 18 82

   * - Option
     - What it does
   * - *(title)*
     - Optional heading, written after ``.. wordsearch::``.
   * - ``:size:``
     - Grid size. ``12`` gives a 12 × 12 square. ``15x10`` gives a
       rectangle 15 columns wide and 10 rows tall. By default the size is
       chosen automatically. If a word is too long the grid grows and the
       build shows a warning.
   * - ``:directions:``
     - Comma-separated list from ``across``, ``down``, ``diagonal``,
       ``backwards``, ``all``. Presets: ``easy`` (across, down), ``medium``
       (across, down, diagonal, the default), ``hard`` (all directions,
       including backwards).
   * - ``:no-overlap:``
     - Words never cross or share a letter. By default, words can cross
       where their letters match. The grid grows if the words won't fit.
   * - ``:no-letter-highlight:``
     - Turns off letter highlighting. By default, pressing a letter key
       highlights every cell with that letter. Students can turn it back on
       in ⚙ settings unless ``:no-settings:`` is set.
   * - ``:no-settings:``
     - Hides the ⚙ settings button, so students can't change the theme,
       letter size or letter highlight.
   * - ``:fill:``
     - ``random`` (default) fills gaps with A–Z. ``words`` fills them with
       letters taken from the puzzle words, which makes it harder.
   * - ``:clues:``
     - Show the clues instead of the words (``WORD : clue`` lines).
   * - ``:timer:``
     - ``up`` for a stopwatch, or a number of minutes for a countdown
       (e.g. ``5`` or ``2.5``). It starts at the first selection.
   * - ``:answers:``
     - ``button`` (default) adds a *Show answers* button. ``hidden`` gives no
       button. ``print`` adds the button and prints an answer key on a
       separate page. ``shown`` shows the answers on load (a teacher copy).
   * - ``:seed:``
     - The same seed and words give the same puzzle on every build, so the
       printed and online versions match. The default seed comes from the
       words, so the puzzle stays stable anyway. ``random`` makes a new
       puzzle on every page load and whenever **Reset** is pressed.
   * - ``:sort:``
     - ``none`` (default, your order), ``alpha``, ``shortest`` (by length,
       shortest first; ``length`` also works), ``longest`` (longest first) or
       ``random`` (reshuffled on each page load and on Reset).
   * - ``:case:``
     - ``upper`` (default) or ``lower``.
   * - ``:instructions:``
     - Replaces the instruction text. The default text changes to
       "find and circle" when printed.
   * - ``:theme:`` / ``:color:`` / ``:style:``
     - ``:theme:`` is the colour theme: ``white`` (default), ``light``,
       ``dark``, ``auto``, ``ocean``, ``forest``, ``sunset`` or ``contrast``
       (see the *Look* section below). ``:color:`` (instruction colour) and
       ``:style:`` (``filled``/``border``/``plain``) are the same as
       ``wordjumble``.

Each example below shows the RST first, then the puzzle it makes.

Basic puzzle
------------

Just a title and a list of words. Everything else uses the defaults: medium
directions, automatic size, a *Show answers* button.

.. code-block:: rst

   .. wordsearch:: Cells and Organelles

      NUCLEUS
      MITOCHONDRIA
      RIBOSOME
      MEMBRANE
      CYTOPLASM
      VACUOLE

.. wordsearch:: Cells and Organelles

   NUCLEUS
   MITOCHONDRIA
   RIBOSOME
   MEMBRANE
   CYTOPLASM
   VACUOLE

No title
--------

The title is optional.

.. code-block:: rst

   .. wordsearch::

      ATOM
      ELEMENT
      COMPOUND
      MIXTURE
      MOLECULE

.. wordsearch::

   ATOM
   ELEMENT
   COMPOUND
   MIXTURE
   MOLECULE

Grid size — ``:size:``
----------------------

``:size: 15`` makes a 15 × 15 grid. A bigger grid with the same words is
harder because there are more filler letters.

.. code-block:: rst

   .. wordsearch:: Big grid
      :size: 15

      ATOM
      ELEMENT
      COMPOUND
      MIXTURE
      MOLECULE

.. wordsearch:: Big grid
   :size: 15

   ATOM
   ELEMENT
   COMPOUND
   MIXTURE
   MOLECULE

Rectangle
~~~~~~~~~

Write the size as columns × rows. ``:size: 16x8`` makes a wide grid that
suits long words. ``:size: 8x14`` makes a tall one that fits beside a long
word list.

.. code-block:: rst

   .. wordsearch:: Wide grid
      :size: 16x8

      PHOTOSYNTHESIS
      CHLOROPHYLL
      GLUCOSE
      OXYGEN
      SUNLIGHT

.. wordsearch:: Wide grid
   :size: 16x8

   PHOTOSYNTHESIS
   CHLOROPHYLL
   GLUCOSE
   OXYGEN
   SUNLIGHT

.. code-block:: rst

   .. wordsearch:: Tall grid
      :size: 8x14

      STOMACH
      OESOPHAGUS
      INTESTINE
      ENZYME
      SALIVA

.. wordsearch:: Tall grid
   :size: 8x14

   STOMACH
   OESOPHAGUS
   INTESTINE
   ENZYME
   SALIVA

Directions — ``:directions:``
-----------------------------

Easy
~~~~

Across and down only.

.. code-block:: rst

   .. wordsearch:: States of matter (easy)
      :directions: easy

      SOLID
      LIQUID
      GAS
      MELTING
      FREEZING
      BOILING

.. wordsearch:: States of matter (easy)
   :directions: easy

   SOLID
   LIQUID
   GAS
   MELTING
   FREEZING
   BOILING

Medium (default)
~~~~~~~~~~~~~~~~

Across, down and diagonal.

.. code-block:: rst

   .. wordsearch:: States of matter (medium)
      :directions: medium

      SOLID
      LIQUID
      GAS
      MELTING
      FREEZING
      BOILING

.. wordsearch:: States of matter (medium)
   :directions: medium

   SOLID
   LIQUID
   GAS
   MELTING
   FREEZING
   BOILING

Hard
~~~~

Every direction, including backwards.

.. code-block:: rst

   .. wordsearch:: States of matter (hard)
      :directions: hard

      SOLID
      LIQUID
      GAS
      MELTING
      FREEZING
      BOILING

.. wordsearch:: States of matter (hard)
   :directions: hard

   SOLID
   LIQUID
   GAS
   MELTING
   FREEZING
   BOILING

Custom list
~~~~~~~~~~~

Name the directions you want. ``backwards`` reverses each direction you
listed, so ``across, backwards`` gives left-to-right and right-to-left words
only.

.. code-block:: rst

   .. wordsearch:: Across and backwards only
      :directions: across, backwards

      SOLID
      LIQUID
      GAS
      MELTING
      FREEZING
      BOILING

.. wordsearch:: Across and backwards only
   :directions: across, backwards

   SOLID
   LIQUID
   GAS
   MELTING
   FREEZING
   BOILING

Overlapping — ``:no-overlap:``
------------------------------

By default, words can cross where their letters match. With ``:no-overlap:``
each word has its own letters.

.. code-block:: rst

   .. wordsearch:: Separate words
      :directions: hard
      :no-overlap:

      PHOTOSYNTHESIS
      CHLOROPHYLL
      GLUCOSE
      OXYGEN
      SUNLIGHT
      CARBON DIOXIDE

.. wordsearch:: Separate words
   :directions: hard
   :no-overlap:

   PHOTOSYNTHESIS
   CHLOROPHYLL
   GLUCOSE
   OXYGEN
   SUNLIGHT
   CARBON DIOXIDE

Letter highlighting — ``:no-letter-highlight:``
-----------------------------------------------

Press a letter key to highlight every cell with that letter. The toolbar
shows the letter and how many there are. Press the same key again, press
**Esc** or click ✕ to clear it. It's a handy hint when students are stuck on
a word.

If a page has more than one puzzle, click the puzzle first so the keys go to
it. Highlights never print.

Try it on the puzzle above. To switch it off, for example when you want the
puzzle harder, add ``:no-letter-highlight:``:

.. code-block:: rst

   .. wordsearch:: No letter highlighting
      :no-letter-highlight:

      ATOM
      ELEMENT
      COMPOUND
      MIXTURE
      MOLECULE

.. wordsearch:: No letter highlighting
   :no-letter-highlight:

   ATOM
   ELEMENT
   COMPOUND
   MIXTURE
   MOLECULE

Filler letters — ``:fill:``
---------------------------

``:fill: words`` fills the gaps with letters taken from the puzzle words
instead of random A–Z. Partial words show up all over the grid, which makes
it much harder.

.. code-block:: rst

   .. wordsearch:: Tricky filler
      :fill: words

      PHOTOSYNTHESIS
      CHLOROPHYLL
      GLUCOSE
      OXYGEN
      SUNLIGHT

.. wordsearch:: Tricky filler
   :fill: words

   PHOTOSYNTHESIS
   CHLOROPHYLL
   GLUCOSE
   OXYGEN
   SUNLIGHT

Multi-word terms
----------------

Spaces, hyphens and other punctuation are dropped in the grid but kept in the
word list.

.. code-block:: rst

   .. wordsearch:: Lab equipment

      BUNSEN BURNER
      TEST TUBE
      CONICAL FLASK
      MEASURING CYLINDER
      TRIPOD
      HEATPROOF MAT

.. wordsearch:: Lab equipment

   BUNSEN BURNER
   TEST TUBE
   CONICAL FLASK
   MEASURING CYLINDER
   TRIPOD
   HEATPROOF MAT

Clues — ``:clues:``
-------------------

Write each line as ``WORD : clue``. The list shows the clue and the letter
count, and the word appears next to its clue once found. On paper each clue
gets an answer line.

.. code-block:: rst

   .. wordsearch:: Forces vocab check
      :clues:

      GRAVITY        : Force that pulls objects towards Earth
      FRICTION       : Force that opposes motion between surfaces
      NEWTON         : Unit of force
      MASS           : Amount of matter in an object
      AIR RESISTANCE : Drag force caused by moving through air
      WEIGHT         : Force of gravity on a mass

.. wordsearch:: Forces vocab check
   :clues:

   GRAVITY        : Force that pulls objects towards Earth
   FRICTION       : Force that opposes motion between surfaces
   NEWTON         : Unit of force
   MASS           : Amount of matter in an object
   AIR RESISTANCE : Drag force caused by moving through air
   WEIGHT         : Force of gravity on a mass

If you write clues but leave out ``:clues:``, the words are shown and the
clues are ignored.

Timer — ``:timer:``
-------------------

Stopwatch
~~~~~~~~~

``:timer: up`` counts up from the first selection and stops when every word
is found.

.. code-block:: rst

   .. wordsearch:: Race the clock
      :timer: up

      CIRCUIT
      CURRENT
      VOLTAGE
      RESISTOR
      SWITCH
      BATTERY

.. wordsearch:: Race the clock
   :timer: up

   CIRCUIT
   CURRENT
   VOLTAGE
   RESISTOR
   SWITCH
   BATTERY

Countdown
~~~~~~~~~

A number sets a countdown in minutes. Decimals work: ``2.5`` is 2 minutes 30
seconds. The timer turns yellow for the last 30 seconds.

.. code-block:: rst

   .. wordsearch:: Two and a half minutes
      :timer: 2.5

      CIRCUIT
      CURRENT
      VOLTAGE
      RESISTOR
      SWITCH
      BATTERY

.. wordsearch:: Two and a half minutes
   :timer: 2.5

   CIRCUIT
   CURRENT
   VOLTAGE
   RESISTOR
   SWITCH
   BATTERY

Answers — ``:answers:``
-----------------------

Hidden
~~~~~~

``hidden`` removes the *Show answers* button.

.. code-block:: rst

   .. wordsearch:: No peeking
      :answers: hidden

      PLANET
      ORBIT
      GALAXY
      COMET
      ASTEROID

.. wordsearch:: No peeking
   :answers: hidden

   PLANET
   ORBIT
   GALAXY
   COMET
   ASTEROID

Printed answer key
~~~~~~~~~~~~~~~~~~

``print`` keeps the button and adds an answer key that only appears when you
print, on a page of its own. Press **🖨 Print** to see it.

.. code-block:: rst

   .. wordsearch:: Space (with printed key)
      :answers: print

      PLANET
      ORBIT
      GALAXY
      COMET
      ASTEROID

.. wordsearch:: Space (with printed key)
   :answers: print

   PLANET
   ORBIT
   GALAXY
   COMET
   ASTEROID

Teacher copy
~~~~~~~~~~~~

``shown`` opens with every answer already shown.

.. code-block:: rst

   .. wordsearch:: Space (teacher copy)
      :answers: shown

      PLANET
      ORBIT
      GALAXY
      COMET
      ASTEROID

.. wordsearch:: Space (teacher copy)
   :answers: shown

   PLANET
   ORBIT
   GALAXY
   COMET
   ASTEROID

Same puzzle every time — ``:seed:``
-----------------------------------

A seed fixes the layout. These two use the same words and seed, so they come
out the same. The default seed comes from the words, so a puzzle only changes
when you change its words.

.. code-block:: rst

   .. wordsearch:: Seed 7 (copy 1)
      :seed: 7
      :size: 9

      ACID
      ALKALI
      NEUTRAL
      INDICATOR
      LITMUS

.. wordsearch:: Seed 7 (copy 1)
   :seed: 7
   :size: 9

   ACID
   ALKALI
   NEUTRAL
   INDICATOR
   LITMUS

.. wordsearch:: Seed 7 (copy 2)
   :seed: 7
   :size: 9

   ACID
   ALKALI
   NEUTRAL
   INDICATOR
   LITMUS

``:seed: random`` gives a new puzzle every time the page loads, so each
student gets a different one, and another fresh puzzle whenever **Reset** is
pressed. It keeps the same words,
grid size, directions and other options. Try pressing Reset below. Don't use
it if you print a worksheet that must match the online version.

.. code-block:: rst

   .. wordsearch:: New layout every build
      :seed: random
      :size: 9

      ACID
      ALKALI
      NEUTRAL
      INDICATOR
      LITMUS

.. wordsearch:: New layout every build
   :seed: random
   :size: 9

   ACID
   ALKALI
   NEUTRAL
   INDICATOR
   LITMUS

Word list order and letter case — ``:sort:`` and ``:case:``
-----------------------------------------------------------

``:sort: alpha`` puts the word list in alphabetical order (the default keeps
your order). ``:case: lower`` uses lower-case letters, which can be easier for
younger readers.

.. code-block:: rst

   .. wordsearch:: Body organs
      :directions: easy
      :sort: alpha
      :case: lower

      stomach
      heart
      lungs
      brain
      liver
      kidney

.. wordsearch:: Body organs
   :directions: easy
   :sort: alpha
   :case: lower

   stomach
   heart
   lungs
   brain
   liver
   kidney

By length
~~~~~~~~~

``:sort: shortest`` lists the words from shortest to longest, and
``:sort: longest`` does the opposite. Only the letters in the grid count, so
``CELL WALL`` counts as 8. Words of the same length are listed alphabetically.

.. code-block:: rst

   .. wordsearch:: Shortest first
      :sort: shortest

      CYTOPLASM
      ATOM
      CELL WALL
      DNA
      MITOCHONDRIA
      GENE
      NUCLEUS

.. wordsearch:: Shortest first
   :sort: shortest

   CYTOPLASM
   ATOM
   CELL WALL
   DNA
   MITOCHONDRIA
   GENE
   NUCLEUS

.. code-block:: rst

   .. wordsearch:: Longest first
      :sort: longest

      CYTOPLASM
      ATOM
      CELL WALL
      DNA
      MITOCHONDRIA
      GENE
      NUCLEUS

.. wordsearch:: Longest first
   :sort: longest

   CYTOPLASM
   ATOM
   CELL WALL
   DNA
   MITOCHONDRIA
   GENE
   NUCLEUS

Random order
~~~~~~~~~~~~

``:sort: random`` shuffles the list every time the page loads and every time
**Reset** is pressed, so students can't just work down the list. Press Reset
below to see it change. Add ``:seed: random`` if you want the grid to change
too.

.. code-block:: rst

   .. wordsearch:: Shuffled list
      :sort: random

      CYTOPLASM
      ATOM
      CELL WALL
      DNA
      MITOCHONDRIA
      GENE
      NUCLEUS

.. wordsearch:: Shuffled list
   :sort: random

   CYTOPLASM
   ATOM
   CELL WALL
   DNA
   MITOCHONDRIA
   GENE
   NUCLEUS

Instructions — ``:instructions:``
---------------------------------

Replaces the line above the puzzle. The default instructions change to "find
and circle" when printed. Custom instructions print as you wrote them.

.. code-block:: rst

   .. wordsearch:: Simple machines
      :instructions: Find all six simple machines. Then pick one and explain how it makes work easier.

      LEVER
      PULLEY
      WHEEL AND AXLE
      INCLINED PLANE
      WEDGE
      SCREW

.. wordsearch:: Simple machines
   :instructions: Find all six simple machines. Then pick one and explain how it makes work easier.

   LEVER
   PULLEY
   WHEEL AND AXLE
   INCLINED PLANE
   WEDGE
   SCREW

Look — ``:theme:``, ``:color:``, ``:style:``
--------------------------------------------

``:theme:`` is the colour theme: ``white`` (default, a plain white panel),
``light`` (a soft grey panel), ``dark``, ``auto`` (match the computer),
``ocean``, ``forest``, ``sunset`` or ``contrast`` (black and white with
strong colours, good on a projector). The same seven colour themes work in ``flashquiz``, ``flashcards``, ``crossword``, ``wordsearch`` and ``guessword``. Printing
is always a plain black-and-white worksheet.

``:color:`` and ``:style:`` work the same as in ``wordjumble``.
``:color:`` sets the instruction colour. ``:style:`` is
``filled`` (default), ``border`` or ``plain``.

Light theme, red, border
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: rst

   .. wordsearch:: Light theme, red, border
      :theme: light
      :color: red
      :style: border

      ENERGY
      KINETIC
      POTENTIAL
      THERMAL
      JOULE

.. wordsearch:: Light theme, red, border
   :theme: light
   :color: red
   :style: border

   ENERGY
   KINETIC
   POTENTIAL
   THERMAL
   JOULE

Dark and ocean themes
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: rst

   .. wordsearch:: Dark theme
      :theme: dark
      :directions: easy

      PLANET
      ORBIT
      GRAVITY
      COMET
      GALAXY

   .. wordsearch:: Ocean theme
      :theme: ocean
      :directions: easy

      TIDE
      CORAL
      PLANKTON
      SALINITY
      CURRENT

.. wordsearch:: Dark theme
   :theme: dark
   :directions: easy

   PLANET
   ORBIT
   GRAVITY
   COMET
   GALAXY

.. wordsearch:: Ocean theme
   :theme: ocean
   :directions: easy

   TIDE
   CORAL
   PLANKTON
   SALINITY
   CURRENT

Plain style, green
~~~~~~~~~~~~~~~~~~

``plain`` removes the box around the puzzle so it sits straight on the page.

.. code-block:: rst

   .. wordsearch:: Plain style, green
      :color: green
      :style: plain

      ENERGY
      KINETIC
      POTENTIAL
      THERMAL
      JOULE

.. wordsearch:: Plain style, green
   :color: green
   :style: plain

   ENERGY
   KINETIC
   POTENTIAL
   THERMAL
   JOULE

Everything together
-------------------

A hard revision puzzle: clues, no overlaps, tricky filler, a 5-minute
countdown and a printed answer key.

.. code-block:: rst

   .. wordsearch:: Year 8 Chemistry revision
      :directions: hard
      :no-overlap:
      :fill: words
      :clues:
      :timer: 5
      :answers: print
      :sort: alpha
      :theme: light
      :color: blue
      :style: border

      PROTON        : Positive particle in the nucleus
      NEUTRON       : Particle in the nucleus with no charge
      ELECTRON      : Negative particle that orbits the nucleus
      PERIODIC TABLE: Chart that arranges all the elements
      REACTANT      : Substance you start with in a reaction
      PRODUCT       : New substance made in a reaction
      CATALYST      : Speeds up a reaction without being used up

.. wordsearch:: Year 8 Chemistry revision
   :directions: hard
   :no-overlap:
   :fill: words
   :clues:
   :timer: 5
   :answers: print
   :sort: alpha
   :theme: light
   :color: blue
   :style: border

   PROTON        : Positive particle in the nucleus
   NEUTRON       : Particle in the nucleus with no charge
   ELECTRON      : Negative particle that orbits the nucleus
   PERIODIC TABLE: Chart that arranges all the elements
   REACTANT      : Substance you start with in a reaction
   PRODUCT       : New substance made in a reaction
   CATALYST      : Speeds up a reaction without being used up
