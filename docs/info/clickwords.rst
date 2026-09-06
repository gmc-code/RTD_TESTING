================================================
Clickwords Directive Documentation
================================================

The clickwords directive creates an interactive "Click the Correct Word" exercise.
Users can select the correct terms from a list of options embedded directly within the paragraph or code structure.

Syntax
-------------------

.. code-block:: rst

    .. clickwords::

        Your text goes here with a @@correct_option | incorrect_1 | incorrect_2@@ placeholder.

Options for the clickwords directive
--------------------------------------

.. list-table::
   :widths: 25 10 65
   :header-rows: 1

   * - Option
     - Type
     - Description
   * - ``:theme:``
     - string
     - Set the visual theme. Options are ``light`` (default) or ``dark``.

| Syntax Rules: Inline dropdown segments are declared using the sequence format
| ``@@correct | incorrect | incorrect_2@@``.
| Correct Answer: The **first** element inside the bracketed option block represents the correct target validation key.
| Shuffling: The directive automatically shuffles options alphabetically when rendering choices to prevent positioning giveaways.
| Dual-Option Fallback: If you only specify a single word like ``@@answer@@``, the directive automatically generates a generic placeholder fallback choice.

----

Example 1: Single Sentences
------------------------------------

| The following example demonstrates a simple gap with 2 alternative choices.
| The correct answer is the first option in the list.

.. code-block:: rst

    .. clickwords::

        In Python, boolean values must be capitalized as @@True | true | TRUE@@ or False.

.. clickwords::

    In Python, boolean values must be capitalized as @@True | true | TRUE@@ or False.

----

Example 2: Dark theme
------------------------------------

| The following example demonstrates the clickwords directive with the dark theme. `:theme: dark` is optional since it is not the default.

.. code-block:: rst

    .. clickwords::
        :theme: dark

        To execute code conditionally, use the @@if | None | else@@ keyword followed by an expression.

.. clickwords::
    :theme: dark

    To execute code conditionally, use the @@if | None | else@@ keyword followed by an expression.

----

Example 3: Single Parameter
-------------------------------------------------

The following example shows what happens when omitting an alternative choice option. The directive creates an alternative fallback choice automatically.

.. code-block:: rst

    .. clickwords::

        Python is an @@interpreted@@ programming language.


.. clickwords::

    Python is an @@interpreted@@ programming language.


----

Example 4: Multiple Options inside Code Snippets
--------------------------------------------------

| The example shows the preservation of indentation and formatting within the code block, while still allowing for interactive selection of choices from a dropdown menu.

.. code-block:: rst

    .. clickwords::

        def find_max(numbers):
            max_val = numbers[@@0 | 1@@]
            for num in @@numbers | max_val@@:
                if num @@> | == | <@@ max_val:
                    max_val = @@num | 0@@
            return max_val

        @@print | return@@(find_max([1, 5, 9]))


.. clickwords::

    def find_max(numbers):
        max_val = numbers[@@0 | 1@@]
        for num in @@numbers | max_val@@:
            if num @@> | == | <@@ max_val:
                max_val = @@num | 0@@
        return max_val

    @@print | return@@(find_max([1, 5, 9]))


.. code-block:: rst

    .. clickwords::

        for number @@in | of@@ [1, 2, 3, 4]:
            if number % 2 == 0:
                @@continue | break | pass@@
            print(number)

.. clickwords::

    for number @@in | of@@  [1, 2, 3, 4]:
        if number % 2 == 0:
            @@continue | break | pass@@
        print(number)

