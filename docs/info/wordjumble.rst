================================================
WordJumble Directive Documentation
================================================

The wordjumble directive creates an interactive text unscrambling exercise.
Words in the input text are automatically jumbled, rendering an interactive input text box to the right of each word for student entry and answer validation.

----

Syntax
-------------------

.. code-block:: rst

    .. wordjumble::

        word1 word2 word3

----

Options for the wordjumble directive
--------------------------------------

.. list-table::
   :widths: 20 10 15 55
   :header-rows: 1

   * - Option
     - Type
     - Default
     - Description
   * - ``:letters:``
     - integer
     - *All*
     - | Number of characters to scramble per word
       | (minimum 2).
   * - ``:shuffle:``
     - string
     - ``random``
     - | Shuffle strategy. Options are ``random`` or ``alpha``
       | (sorts scrambled letters A-Z).
   * - ``:keep-first:``
     - flag
     - *None*
     - Locks the first letter of each word in place.
   * - ``:keep-first-two:``
     - flag
     - *None*
     - Locks the first two letters of each word in place.
   * - ``:keep-last:``
     - flag
     - *None*
     - Locks the last letter of each word in place.
   * - ``:instructions:``
     - string
     - *Default text*
     - | Custom instruction header displayed
       | above the exercise block.
   * - ``:theme:``
     - string
     - ``white``
     - | Visual background theme.
       | Options are ``white`` or ``light``.
   * - ``:color:``
     - string
     - ``blue``
     - | Accent color for instruction headers
       | (e.g., ``blue``, ``green``, ``red``).
   * - ``:style:``
     - string
     - ``filled``
     - | Container border variant.
       | Options are ``filled``,  or ``plain``.

| Minimum Scramble Rule: A minimum of 2 letters will always be jumbled per word.
| Anti-Identity Guarantee: If a shuffle, using specified options produces the original word, it automatically retries. If it fails repeatedly, it falls back to a shuffle to ensure the word is never displayed unshuffled.
| Dynamic Input Box Sizing: Text boxes automatically size themselves based on the character length of the target word.
| Answer Verification: Click the "Check Answers" button to validate entries. Incorrect entries reveal the correct spelling in green.

----

Example 1: Basic Word List (Default Options)
--------------------------------------------

| Scrambles all characters within a list of science terms using default settings.

.. code-block:: rst

    .. wordjumble::

        chromatography crystallization evaporation

.. wordjumble::

    chromatography crystallization evaporation

----

Example 2: Alphabetical Sorting (:shuffle:)
-------------------------------------------

| Uses ``:shuffle: alpha`` to sort the scrambled characters in alphabetical order (A-Z) instead of a random shuffle.

.. code-block:: rst

    .. wordjumble::
        :shuffle: alpha
        :instructions: Unjumble these biology terms (scrambled letters are sorted A to Z):

        bioluminescence biodegradability photosynthesizers

.. wordjumble::
    :shuffle: alpha
    :instructions: Unjumble these biology terms (scrambled letters are sorted A to Z):

    bioluminescence biodegradability photosynthesizers

----

Example 3: Partial Scramble (:letters:)
---------------------------------------

| Uses ``:letters: 2`` to limit character swaps to a minimum/maximum of two letters per word, making the puzzle easier.

.. code-block:: rst

    .. wordjumble::
        :letters: 2

        root cell seed

.. wordjumble::
    :letters: 2

    root cell seed

----

Example 4: Lock First & Last Letters
------------------------------------

| Combines ``:keep-first:`` and ``:keep-last:`` flags so only inner characters are scrambled (the *typoglycemia* effect).

.. code-block:: rst

    .. wordjumble::
        :keep-first:
        :keep-last:
        :letters: 2

        root cell seed

.. wordjumble::
    :keep-first:
    :keep-last:
    :letters: 2

    root cell seed


.. code-block:: rst

    .. wordjumble::
        :keep-first:
        :keep-last:
        :shuffle: alpha

        root cell seed

.. wordjumble::
    :keep-first:
    :keep-last:
    :shuffle: alpha

    root cell seed


.. code-block:: rst

    .. wordjumble::
        :keep-first-two:
        :keep-last:
        :letters: 2

        roots cells seeds

.. wordjumble::
    :keep-first-two:
    :keep-last:
    :letters: 2

        roots cells seeds

----

Example 5: Custom Instructions
--------------------------------------

| Demonstrates custom instruction header textt.

.. code-block:: rst

    .. wordjumble::
        :instructions: Unjumble these cell biology terms:
        :color: green

        nucleus membrane vacuole

.. wordjumble::
    :instructions: Unjumble these cell biology terms:
    :color: green

    nucleus membrane vacuole

----

Example 6: Style Variants (:style:)
-----------------------------------

| Demonstrates the ``plain`` container style variant using Earth & Space science terms.

.. code-block:: rst

    .. wordjumble::
        :style: plain
        :instructions: Unjumble these space terms:

        gravity planet

.. wordjumble::
    :style: plain
    :instructions: Unjumble these space terms:

    gravity planet

| Demonstrates the ``filled`` container style variant using Earth & Space science terms.

.. code-block:: rst

    .. wordjumble::
        :style: filled
        :color: red
        :instructions: Unjumble these space terms:

        gravity planet

.. wordjumble::
    :style: filled
    :instructions: Unjumble these space terms:

    gravity planet

----

Example 7: Theme
--------------------------------------

| Demonstrates the ``light`` theme variant.

.. code-block:: rst

    .. wordjumble::
        :theme: light

        nucleus membrane

.. wordjumble::
    :theme: light

    nucleus membrane

| Demonstrates the ``light`` theme variant with the :style: plain variant.

.. code-block:: rst

    .. wordjumble::
        :theme: light
        :style: plain

        nucleus membrane

.. wordjumble::
    :theme: light
    :style: plain

    nucleus membrane

