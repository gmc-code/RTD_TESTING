Flashcards
==========

The ``flashcards`` directive makes a deck of flip cards with **spaced
repetition**. Students flip each card, then say how well they knew it.
Cards they know come back less often. Cards they don't know come back
soon, and again later in the same session.

Each student's progress is saved in their own browser, so nothing is
sent anywhere and no login is needed. It also means progress stays on that
device and browser: a student who switches computers starts again.

The **🖨 Print** button prints the deck as a fold-and-cut sheet: fronts on
the left, backs on the right, with a fold line down the middle. Printing
the whole page from the browser gives the same sheet.

How the spaced repetition works
-------------------------------

Every card sits in one of five boxes (the coloured bars at the top right of
the deck). New cards haven't been seen yet.

.. list-table::
   :header-rows: 1
   :widths: 22 78

   * - Button
     - What happens to the card
   * - ✓ **Knew it** (key ``3``)
     - Moves up one box. It comes back after that box's wait.
   * - ~ **Unsure** (key ``2``)
     - Stays in its box and comes back after half that box's wait.
   * - ✗ **Didn't know** (key ``1``)
     - Goes back to box 1. It also comes back a few cards later in the same
       session (up to three times).

With the default ``:intervals:`` of ``0, 1, 3, 7, 14``, a card in box 1 is
due every session, box 2 the next day, box 3 in three days, box 4 in a
week, and box 5 in a fortnight. Whole days are counted from midnight, so a
card reviewed at 3 pm is due first thing on its due day.

**Start review** shows only the cards that are due, weakest first, plus a
few new cards. **Practise all** goes through every card in the chosen
sections and doesn't change when anything is due, so it suits a quick
whole-class run-through on the board.

Keyboard: ``Space`` or ``Enter`` flips, ``1`` ``2`` ``3`` rate the card
(the numbers are shown on the buttons),
``Esc`` goes back to the start, ``F`` is full screen.

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
     - Optional heading, written after ``.. flashcards::``.
   * - ``:new-per-session:``
     - integer
     - ``10``
     - How many new cards are added to each review (default ``10``).
       Students can change this in ⚙ Settings.
   * - ``:intervals:``
     - list of integers
     - ``0, 1, 3, 7, 14``
     - Five numbers of days, one for each box (default ``0, 1, 3, 7, 14``).
       Decimals work, so ``0, 0.01, 0.02, 0.04, 0.08`` gives waits of a few
       minutes, which is handy for trying the deck out.
   * - ``:reverse:``
     - flag
     - Off
     - Show the back of each card first (e.g. give the definition and ask
       for the word). Students can switch this in Settings.
   * - ``:shuffle:``
     - flag
     - Off
     - Shuffle the cards. Without it, due cards come weakest first and new
       cards come in your order.
   * - ``:theme:``
     - string
     - ``dark``
     - ``dark`` (default), ``light``, ``auto`` (match the computer),
       ``ocean``, ``forest``, ``sunset`` or ``contrast`` (black and white
       with strong colours, good on a washed-out projector). The same seven colour themes work in ``flashquiz``, ``flashcards``, ``crossword``, ``wordsearch`` and ``guessword``.
       Students can change it in Settings.
   * - ``:sections:``
     - string
     - *All*
     - Which sections start switched on, as names or numbers separated by
       commas (e.g. ``Forces, Motion`` or ``1, 2``). By default all are on.
       Students can still switch sections on and off in Settings.
   * - ``:id:``
     - string
     - *From the page and title*
     - The name progress is saved under. By default it comes from the page
       and the title, so changing the title starts everyone again. Give two
       decks the same ``:id:`` to share progress between pages.

Content rules:

* ``Front | Back`` is one card. Only the first ``|`` splits the line.
* ``# Heading`` starts a section. With two or more sections, students can
  choose which ones to study in Settings (see `Choosing sections`_).
* ``\n`` inside a side starts a new line on the card.
* Progress for a card is linked to its **front**. Fixing a typo in a back
  keeps students' progress; changing a front makes it a new card.
* Blank lines and ``..`` comment lines are ignored.

Each example below shows the RST first, then the deck it makes.

Basic deck
----------

.. code-block:: rst

   .. flashcards:: Cells and Organelles

      Nucleus | Controls the cell and contains DNA
      Cell membrane | Controls what enters and leaves the cell
      Cytoplasm | Jelly-like fluid where reactions happen
      Mitochondria | Where respiration releases energy
      Ribosome | Makes proteins

.. flashcards:: Cells and Organelles

   Nucleus | Controls the cell and contains DNA
   Cell membrane | Controls what enters and leaves the cell
   Cytoplasm | Jelly-like fluid where reactions happen
   Mitochondria | Where respiration releases energy
   Ribosome | Makes proteins

Shuffle and a colour theme
--------------------------

.. code-block:: rst

   .. flashcards:: Forces and Motion
      :shuffle:
      :theme: forest
      :new-per-session: 6

      # Forces
      Force | A push or a pull, measured in newtons (N)
      Friction | A force that opposes motion between surfaces
      Gravity | A non-contact force that pulls masses together
      Weight | The force of gravity on a mass\nW = m × g

      # Motion
      Speed | Distance travelled per unit of time
      Speed formula | speed = distance ÷ time
      Acceleration | A change in velocity over time
      Balanced forces | Forces that cancel out, so motion doesn't change

.. flashcards:: Forces and Motion
   :shuffle:
   :theme: forest
   :new-per-session: 6

   # Forces
   Force | A push or a pull, measured in newtons (N)
   Friction | A force that opposes motion between surfaces
   Gravity | A non-contact force that pulls masses together
   Weight | The force of gravity on a mass\nW = m × g

   # Motion
   Speed | Distance travelled per unit of time
   Speed formula | speed = distance ÷ time
   Acceleration | A change in velocity over time
   Balanced forces | Forces that cancel out, so motion doesn't change

Choosing sections
-----------------

Put ``# Heading`` lines between groups of cards to make sections. The
start screen shows which sections are being studied, with a **change**
link that opens ⚙ Settings, where each section has a tick box with its
card count, plus **All** and **None**.

``:sections:`` chooses which sections start switched on. Here only the
first two are on, so a class can start with this week's topics and add
*Separating mixtures* later. Each student's choice is saved in their
browser. If you change ``:sections:`` later, everyone goes back to your
new choice.

.. code-block:: rst

   .. flashcards:: Mixtures and Solutions
      :theme: ocean
      :sections: Pure substances, Solutions

      # Pure substances
      Pure substance | Contains only one type of particle
      Element | A substance made of only one type of atom
      Compound | Two or more elements chemically joined

      # Solutions
      Solute | The substance that dissolves
      Solvent | The liquid that does the dissolving
      Solution | A solute dissolved in a solvent
      Soluble | Able to dissolve

      # Separating mixtures
      Filtration | Separates an insoluble solid from a liquid
      Evaporation | Separates a dissolved solid from a solution
      Distillation | Separates a liquid from a solution by boiling and condensing
      Chromatography | Separates dyes or inks

.. flashcards:: Mixtures and Solutions
   :theme: ocean
   :sections: Pure substances, Solutions

   # Pure substances
   Pure substance | Contains only one type of particle
   Element | A substance made of only one type of atom
   Compound | Two or more elements chemically joined

   # Solutions
   Solute | The substance that dissolves
   Solvent | The liquid that does the dissolving
   Solution | A solute dissolved in a solvent
   Soluble | Able to dissolve

   # Separating mixtures
   Filtration | Separates an insoluble solid from a liquid
   Evaporation | Separates a dissolved solid from a solution
   Distillation | Separates a liquid from a solution by boiling and condensing
   Chromatography | Separates dyes or inks

Definition first, with quick intervals for testing
--------------------------------------------------

``:reverse:`` shows the back first, so students recall the word from its
meaning. The tiny ``:intervals:`` make cards due again within minutes, so
you can see the boxes fill up straight away.

.. code-block:: rst

   .. flashcards:: Chemistry Words
      :reverse:
      :intervals: 0, 0.002, 0.005, 0.01, 0.02
      :id: chem-words-demo

      Element | A substance made of only one type of atom
      Compound | Two or more elements chemically joined
      Mixture | Substances mixed but not chemically joined
      Solute | The substance that dissolves
      Solvent | The liquid that does the dissolving

.. flashcards:: Chemistry Words
   :reverse:
   :intervals: 0, 0.002, 0.005, 0.01, 0.02
   :id: chem-words-demo

   Element | A substance made of only one type of atom
   Compound | Two or more elements chemically joined
   Mixture | Substances mixed but not chemically joined
   Solute | The substance that dissolves
   Solvent | The liquid that does the dissolving
