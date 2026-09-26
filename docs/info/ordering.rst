

================================================
Ordering Directive Documentation
================================================

The ordering directive creates an interactive code-reordering exercise. Users can drag and drop code lines into their correct sequence and adjust indentation levels.

Syntax
-------------------

.. code-block:: rst

    .. ordering::

        code lines to be arranged in the correct order

Options for the ordering directive
--------------------------------------

.. list-table:: Ordering Directive Options
   :widths: 20 10 70
   :header-rows: 1

   * - Option
     - Type
     - Description
   * - ``:no-solution:``
     - flag
     - If present, hides the "Show Solution" button from the user.
   * - ``:no-reorder:``
     - flag
     - If present, keeps the initial line order while leaving indentation interactive.
   * - ``:no-padding:``
     - flag
     - If present, removes vertical padding from the lines to drag.
   * - ``:show-code:``
     - flag
     - If present, displays the final completed text/code block upon achieving a 100% score for easy copying.
   * - ``:paragraph:``
     - flag
     - Splits paragraphs down into individual sentences and hides indentation controls («, »). Reorders sentences within each block while preserving general reading structure.
   * - ``:paragraphblocks:``
     - flag
     - Groups content into full multi-line paragraph blocks (separated by double newlines) and hides indentation controls («, »). Ideal for reordering entire sections, prose, or report paragraphs.
   * - ``:no-indent:``
     - flag
     - Alias for paragraph-style display. Disables indentation controls for non-code text ordering.
   * - ``:keeprst:``
     - flag
     - Renders reStructuredText inline markup (e.g., **bold**, *italics*, links) inside cards. Leave off for raw code snippets to prevent syntax misinterpretation.
   * - ``:theme:``
     - string
     - Set the visual theme. Options are ``white`` (default) or ``light``.


| **Structure**: The directive creates an interactive <div> block with handle controls (☰) for reordering elements and buttons («, ») for adjusting indentation.
| **Indentation**: In standard code mode, the directive automatically calculates the indentation level based on groups of 4 spaces. Ensure your input code uses consistent 4-space indentation.
| **Paragraph Modes**: Use ``:paragraphblocks:`` to reorder full multi-line blocks, or ``:paragraph:`` to split text into individual sentences for fine-grained reordering. Indentation controls are automatically hidden in both modes.
| **RST Formatting**: Use ``:keeprst:`` if your cards contain prose with markup like bolding, italics, or headings. Omit it for code blocks so characters like ``*args`` or math operators are rendered safely as literal text.
| **Guaranteed Shuffling**: Items are automatically randomized on page render and on Reset button click, with checks in place to guarantee the starting display order differs from the correct answer key.
| **Visual Badges**: When validated, inline symbols provide quick feedback right alongside choices.
| **Empty Lines**: In standard code mode, empty lines render as blank placeholders that users can drag to maintain formatting structure.


----

Example 1: light theme
------------------------------------

| The default theme is light. The following example demonstrates the ordering directive with the light theme. `:theme: light` is optional since it is the default.

.. code-block:: rst

    .. ordering::
        :theme: light

        def hello_world():
            print("Hello World")

.. ordering::
    :theme: light

    def hello_world():
        print("Hello World")

----

Example 2: dark theme
------------------------------------


.. code-block:: rst

    .. ordering::
        :theme: dark

        def hello_world():
            print("Hello World")

.. ordering::
    :theme: dark

    def hello_world():
        print("Hello World")


----


Example 3: Show code
------------------------------------

| The following example demonstrates the ordering directive with the "Show Code" button shown.
| `:show-code:` is used to show the code block.

.. code-block:: rst

    .. ordering::
        :show-code:

        def hello_world():
            print("Hello World")

.. ordering::
    :show-code:

    def hello_world():
        print("Hello World")


----

Example 4: no solution button
-------------------------------

| The following example demonstrates the ordering directive with the "Show Solution" button hidden.
| `:no-solution:` is used to hide the solution button.

.. code-block:: rst

    .. ordering::
        :no-solution:

        def add(num1, num2):
            return num1 + num2



.. ordering::
    :no-solution:

    def add(num1, num2):
        return num1 + num2

----

Example 5: no padding
-------------------------------

| The following example demonstrates the ordering directive with padding removed from the lines to drag.
| `:no-padding:` is used to remove vertical padding.

.. code-block:: rst

    .. ordering::
        :no-padding:

        def add(num1, num2):
            return num1 + num2

        print(add(5, 3))


.. ordering::
    :no-padding:

    def add(num1, num2):
        return num1 + num2

    print(add(5, 3))


Example 6: no reorder
-------------------------------------

| The following example demonstrates the ordering directive with multiple indentation levels. The directive automatically calculates the indentation level based on groups of 4 spaces.
| `:no-reorder:` is used to keep answer order without indenting.

.. code-block:: rst

    .. ordering::
        :no-reorder:

        def find_max(numbers):
            max_val = numbers[0]
            for num in numbers:
                if num > max_val:
                    max_val = num
            return max_val

Reorder the following code snippets to create a function that finds the maximum value in a list of numbers.

.. ordering::
    :no-reorder:

    def find_max(numbers):
        max_val = numbers[0]
        for num in numbers:
            if num > max_val:
                max_val = num
        return max_val

----

Example 7: blanks lines
-------------------------------------

| The following example demonstrates the ordering directive with blank lines included. The directive will render them as placeholders that users can drag to maintain formatting structure.

.. code-block:: rst

    .. ordering::

        def rect_perimeter(width, height):
            return 2 * (width + height)

        def rect_area(width, height):
            area = width * height
            return area

        print(f'Perimeter: {rect_perimeter(5, 3)}')
        print(f'Area: {rect_area(5, 3)}')


| Write functions that returns the total perimeter and area of a rectangle in that order.
| Print the perimeter and area of a rectangle with width 5 and height 3.

.. ordering::

    def rect_perimeter(width, height):
        return 2 * (width + height)

    def rect_area(width, height):
        area = width * height
        return area

    print(f'Perimeter: {rect_perimeter(5, 3)}')
    print(f'Area: {rect_area(5, 3)}')

----

Example 8: paragraph
-------------------------------------

| The following example demonstrates the ordering directive with a paragraph.
| It also demonstrates the `:keeprst:` option to keep rst formatting, so headings and bold words are preserved.

.. code-block:: rst

    .. ordering::
        :paragraph:
        :keeprst:

        The **platypus** is a very unusual animal from eastern Australia. It has a bill like a duck, a tail like a beaver, and webbed feet for swimming. Its thick fur keeps it warm and dry in cold river water.

.. ordering::
    :paragraph:
    :keeprst:

    The **platypus** is a very unusual animal from eastern Australia. It has a bill like a duck, a tail like a beaver, and webbed feet for swimming. Its thick fur keeps it warm and dry in cold river water.

----


Example 9: paragraphblocks
-------------------------------------

| The following example demonstrates the ordering directive with a paragraphblocks option.
| It also demonstrates the `:keeprst:` option to keep rst formatting, so headings and bold words are preserved.


.. code-block:: rst

    .. ordering::
        :paragraphblocks:
        :keeprst:

        The **platypus** is a very unusual animal from eastern Australia. It has a bill like a duck, a tail like a beaver, and webbed feet for swimming. Its thick fur keeps it warm and dry in cold river water.

        This animal is special because it lays **eggs** instead of giving birth to live babies. It hunts underwater with its eyes and ears closed. Instead, its bill can feel tiny electrical signals from swimming bugs and shrimp. Male platypuses also have sharp, **venomous spurs** on their back legs for protection.

        Today, platypuses face big problems in the wild. Building dams and cutting down trees ruins their river homes. Trash in the water can also hurt them. People are working hard to clean up rivers so the platypus stays safe.

.. ordering::
    :paragraphblocks:
    :keeprst:

    The **platypus** is a very unusual animal from eastern Australia. It has a bill like a duck, a tail like a beaver, and webbed feet for swimming. Its thick fur keeps it warm and dry in cold river water.

    This animal is special because it lays **eggs** instead of giving birth to live babies. It hunts underwater with its eyes and ears closed. Instead, its bill can feel tiny electrical signals from swimming bugs and shrimp. Male platypuses also have sharp, **venomous spurs** on their back legs for protection.

    Today, platypuses face big problems in the wild. Building dams and cutting down trees ruins their river homes. Trash in the water can also hurt them. People are working hard to clean up rivers so the platypus stays safe.
