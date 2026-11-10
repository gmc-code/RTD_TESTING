Crossword
=========

The ``crossword`` directive turns a list of answers and clues into an
interactive crossword. The grid is laid out automatically, so you only write
the words and clues. Everyone starts with the same puzzle, and the **↻ New**
button redraws it in a different pattern. Give it a long list of words with
``:words:``, and each new puzzle uses a different selection from the list.

Students can type straight into the grid, check their letters, reveal a
letter or word when they're stuck, and print a blank copy or an answer key.
Answers are saved in the browser, so a student can come back to a half-finished
puzzle. A few letters can be filled in as hints, and the **⚙** button opens
settings for the letter size, hint letters, number of words and the border.

Example
-------

Source:

.. code-block:: rst

   .. crossword:: Cells and organelles
      :wordbank:
      :hints: 6

      NUCLEUS       | Controls the activities of the cell and contains DNA
      CYTOPLASM     | Jelly-like substance where most chemical reactions happen
      MITOCHONDRIA  | Where aerobic respiration releases energy
      CELL WALL     | Rigid layer made of cellulose that supports a plant cell
      ...


.. crossword:: Cells and organelles
   :wordbank:
   :hints: 6

   NUCLEUS       | Controls the activities of the cell and contains DNA
   CYTOPLASM     | Jelly-like substance where most chemical reactions happen
   MITOCHONDRIA  | Where aerobic respiration releases energy
   RIBOSOME      | Tiny structure where proteins are made
   CHLOROPLAST   | Contains chlorophyll and absorbs light for photosynthesis
   CELL WALL     | Rigid layer made of cellulose that supports a plant cell
   VACUOLE       | Large space filled with cell sap in a plant cell
   MEMBRANE      | Controls what enters and leaves the cell
   MICROSCOPE    | Instrument used to see cells
   TISSUE        | A group of similar cells working together
   ORGAN         | Several tissues working together, e.g. the heart
   DIFFUSION     | Movement of particles from high to low concentration



Writing the word list
---------------------

* Put one answer per line in the form ``ANSWER | clue``.
* Capitals are optional, as the grid is always shown in capitals.
* Spaces and hyphens are removed from the grid but kept in the letter count,
  so ``CELL WALL`` appears as *(4,4)* and ``X-RAY`` as *(1-3)*.
* Blank lines and lines starting with ``#`` are ignored, so you can comment
  out a word.
* The title after ``.. crossword::`` is optional.

Words have to share letters to join the grid. If a word can't be linked in,
the build shows a warning naming it. Change ``:seed:`` or add a word that
shares letters with it. Ten to twenty words of mixed lengths usually give a
good puzzle.

Options
-------

.. list-table::
   :header-rows: 1
   :widths: 20 80

   * - Option
     - What it does
   * - ``:wordbank:``
     - Shows all the answers in a box under the puzzle. Words are crossed out
       once they're correctly in the grid. Good for younger or EAL/D students.
   * - ``:hints:``
     - Fills in some letters at random when the page opens. Give a number,
       such as ``:hints: 5``, or a percentage of the squares, such as
       ``:hints: 20%``. Hints are spread across different words, and a word is
       never completely filled in. Hint letters are shaded and can't be
       changed. They also appear on the printed blank copy.
   * - ``:first-letters:``
     - Shows the first letter of every word as a hint. Works alongside
       ``:hints:``, which adds random letters on top. Students can switch it
       on or off with **First letters** in ⚙ settings.
   * - ``:letter-size:``
     - Size of the squares and letters: ``small``, ``medium`` (default),
       ``large``, ``x-large``, or a percentage between 70 and 170, such as
       ``:letter-size: 130``. Larger sizes suit projecting on a board.
   * - ``:full-width:``
     - Makes the grid fill the full width of the page, with the clues
       underneath. Good for projecting on a board. Students can switch this
       on or off with **Fill width** in ⚙ settings.
   * - ``:border:``
     - Draws a thin border around the whole puzzle.
   * - ``:theme:``
     - Colour scheme: ``classic`` (default), ``ocean``, ``forest``,
       ``sunset``, ``contrast`` (high contrast) or ``dark``. Students can
       change it in ⚙ settings. Printing always uses plain black and white.
   * - ``:words:``
     - How many words to use from the list, such as ``:words: 10``. Write a
       long list (say 30 words) and each puzzle uses a different selection,
       so pressing **↻ New** gives fresh words as well as a new pattern.
       Without it every word in the list is used.
   * - ``:seed:``
     - A whole number such as ``:seed: 7``. Everyone starts with the same
       puzzle. Change the seed to change that starting puzzle.
   * - ``:no-lengths:``
     - Hides the *(n)* letter counts after each clue, which makes the puzzle
       harder.
   * - ``:no-save:``
     - Doesn't remember answers in the browser, which suits shared classroom
       computers.
   * - ``:id:``
     - Sets the HTML id of the puzzle, if you want to link to it.
   * - ``:class:``
     - Adds extra CSS classes to the puzzle.

Using the puzzle
----------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Action
     - How
   * - Choose a word
     - Click a square or a clue.
   * - Switch Across / Down
     - Click the same square again, or press :kbd:`Space` or :kbd:`Enter`.
   * - Move around
     - Arrow keys. :kbd:`Tab` and :kbd:`Shift+Tab` jump to the next or
       previous clue.
   * - Fix a mistake
     - :kbd:`Backspace` deletes and steps back. :kbd:`Delete` clears the
       square.
   * - ✓ Check
     - Wrong letters turn red. Correct ones turn green.
   * - 💡 Reveal letter ▾
     - **💡 Reveal letter** shows the selected letter and moves on to the next
       square. Pressing :kbd:`?` in a square does the same. The **▾** next to
       it reveals the whole word or the whole puzzle. Revealed squares get a
       small red corner, so you can see who needed help. The "Solved! Well
       done." message only appears if no letters were revealed.
   * - ↻ New
     - Redraws the crossword in a different pattern (with ``:words:``, also
       a different selection of words). If answers have been typed, the
       button asks you to click again to confirm.
   * - ⚙
     - Settings: the letter size, **Fill width**, the number of hint letters (**↻** picks a different set), **First letters**, how many words per puzzle, the colour theme
       and the border. Changes are remembered in that
       browser. **Reset** goes back to the page's defaults.
   * - ⛶
     - Full screen, for projecting on a board. The grid grows to fill the
       screen with the clues beside it. Press :kbd:`Esc` or ⛶ again to exit.
   * - 🖨 Print ▾
     - **Blank copy** prints the current puzzle with Name / Class / Date
       lines. **Answer key** prints its solution. Either way only the crossword is
       printed and it is sized to fit an A4 page.

Harder example
--------------

Without the word bank or letter counts, with large letters, a border, the
ocean theme and three hint letters:

.. code-block:: rst

    .. crossword:: Forces (challenge)
        :no-lengths:
        :seed: 3
        :letter-size: large
        :border:
        :theme: ocean
        :hints: 3

        GRAVITY      | Force that pulls objects towards the Earth
        FRICTION     | Force that opposes motion between two surfaces
        ...


.. crossword:: Forces (challenge)
   :no-lengths:
   :seed: 3
   :letter-size: large
   :border:
   :theme: ocean
   :hints: 3

   GRAVITY      | Force that pulls objects towards the Earth
   FRICTION     | Force that opposes motion between two surfaces
   NEWTON       | Unit of force
   MASS         | Amount of matter in an object, measured in kilograms
   WEIGHT       | Force of gravity acting on a mass
   AIR RESISTANCE | Friction caused by moving through air
   BALANCED     | Forces that are equal in size and opposite in direction
   UPTHRUST     | Upward force from a liquid or gas
   MAGNETISM    | Non-contact force between a magnet and iron
   SPRING BALANCE | Instrument used to measure force

Word pool example
-----------------

Twenty words in the list, ten used in each puzzle. Press **↻ New** for a
different set:

.. code-block:: rst

   .. crossword:: Particles and matter (10 from 20)
      :words: 10
      :hints: 10%

      SOLID        | State with a fixed shape and volume
      LIQUID       | State that flows and takes the shape of its container
      ...


.. crossword:: Particles and matter (10 from 20)
   :words: 10
   :hints: 10%

   SOLID        | State with a fixed shape and volume
   LIQUID       | State that flows and takes the shape of its container
   GAS          | State that fills any container it is in
   MELTING      | Change from solid to liquid
   FREEZING     | Change from liquid to solid
   EVAPORATION  | Change from liquid to gas below the boiling point
   CONDENSATION | Change from gas to liquid
   SUBLIMATION  | Change from solid straight to gas
   PARTICLES    | Tiny pieces that all matter is made of
   DIFFUSION    | Spreading of particles from high to low concentration
   PRESSURE     | Force from gas particles hitting the walls of a container
   DENSITY      | Mass per unit volume
   VIBRATE      | How particles move in a solid
   BOILING POINT | Temperature at which a liquid boils
   MELTING POINT | Temperature at which a solid melts
   EXPANSION    | Increase in size when heated
   CONTRACTION  | Decrease in size when cooled
   ATOM         | Smallest particle of an element
   MOLECULE     | Two or more atoms joined together
   KINETIC      | Type of energy particles have because they move


