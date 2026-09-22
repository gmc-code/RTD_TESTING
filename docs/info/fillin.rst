================================================
Fillin Directive Documentation
================================================

The fillin directive creates an interactive "Fill-in-the-Blanks" text or code exercise.
Users type the missing terms directly into text input fields embedded within the paragraph or code structure.

Syntax
-------------------

.. code-block:: rst

    .. fillin::

        Your text goes here with a @@correct_answer@@ placeholder.

Options for the fillin directive
--------------------------------------

.. list-table::
   :widths: 25 10 65
   :header-rows: 1

   * - Option
     - Type
     - Description
   * - ``:theme:``
     - string
     - Set the visual theme. Options are ``white`` (default) or ``light``.
   * - ``:case_sensitive:``
     - flag
     - Require exact letter case matching during answer evaluation.

| Syntax Rules: Inline text input fields are declared using the sequence format ``@@correct_answer@@``.
| Correct Answer: The string placed inside the ``@@...@@`` brackets represents the exact answer required for validation.
| Pressing Enter: Users can press the "Enter" key while focused inside any text box to evaluate their answers immediately.

----

Example 1: Single Sentences
------------------------------------

| The following example demonstrates a simple gap where the user must type in the answer.

.. code-block:: rst

    .. fillin::

        In Python, variables are expected to use @@snake@@ case, such as "high_score".

.. fillin::

    In Python, variables are expected to use @@snake@@ case, such as "high_score".

----

Example 2: Multiple inputs
------------------------------------

| The following example demonstrates 2 gaps where the user must type in the answer.

.. code-block:: rst

    .. fillin::

        Strings in python are surrounded by either @@single@@ quotation marks, or double @@quotation@@ marks.

.. fillin::

    Strings in python are surrounded by either @@single@@ quotation marks, or double @@quotation@@ marks.


----

Example 3: Multiple sentences
------------------------------------

| The following example demonstrates mulitiple gaps where the user must type in the answer.

.. code-block:: rst

    .. fillin::

        You can return a range of characters by using the @@slice@@ syntax.
        Specify the start index and the end index, separated by a @@colon@@, to return a part of the string.

.. fillin::

    You can return a range of characters by using the @@slice@@ syntax.
    Specify the start index and the end index, separated by a @@colon@@, to return a part of the string.

----

Example 3: Case-Sensitive Matching
------------------------------------

| Use the ``:case_sensitive:`` option to require exact capitalization.

.. code-block:: rst

    .. fillin::
        :case_sensitive:

        In Python, boolean values must be capitalized as @@True@@ or False.

.. fillin::
    :case_sensitive:

    In Python, boolean values must be capitalized as @@True@@ or False.

----

Example 4: Light Theme
------------------------------------

| The following example demonstrates the fillin directive using the light theme.

.. code-block:: rst

    .. fillin::
        :theme: light

        To execute code conditionally, use the @@if@@ keyword followed by an expression.

.. fillin::
    :theme: light

    To execute code conditionally, use the @@if@@ keyword followed by an expression.

----

Example 5: Code Snippets
--------------------------------------------------

| Indentation and code formatting are preserved while letting users type in missing terms directly.

.. code-block:: rst

    .. fillin::

        def find_max(numbers):
            max_val = @@numbers@@[0]
            for num in @@numbers@@:
                if num @@>@@ max_val:
                    max_val = @@num@@
            return max_val

        print(find_max([1, 5, 9]))


.. fillin::

    def find_max(numbers):
        max_val = @@numbers@@[0]
        for num in @@numbers@@:
            if num @@>@@ max_val:
                max_val = @@num@@
        return max_val

    print(find_max([1, 5, 9]))


.. code-block:: rst

    .. fillin::

        for number @@in@@ [1, 2, 3, 4]:
            if number % 2 == 0:
                @@continue@@
            print(number)

.. fillin::

    for number @@in@@ [1, 2, 3, 4]:
        if number % 2 == 0:
            @@continue@@
        print(number)





