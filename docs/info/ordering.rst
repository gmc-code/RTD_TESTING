

================================================
Ordering Directive Documentation
================================================

The ordering directive creates an interactive code-reordering exercise. Users can drag and drop code lines into their correct sequence and adjust indentation levels.

Syntax
-------------------

.. code-block:: rst

    .. ordering::

        code lines to be arranged in the correct order

options for the ordering directive
--------------------------------------

+------------------+--------+-----------------------------------------------------------+
| Option           | Type   | Description                                               |
+==================+========+===========================================================+
| ``:theme:``      | string | Set the visual theme. Options are ``light`` (default)     |
|                  |        | or ``dark``.                                              |
+------------------+--------+-----------------------------------------------------------+
| ``:no-solution:``| flag   | If present, hides the "Show Solution" button from the     |
|                  |        | user.                                                     |
+------------------+--------+-----------------------------------------------------------+

----

Example 1
=======================

Reorder the following code snippets to create a function that finds the maximum value in a list of numbers.

.. code-block:: rst

    .. ordering::

        def find_max(numbers):
            max_val = numbers[0]
            for num in numbers:
                if num > max_val:
                    max_val = num
            return max_val

.. ordering::

    def find_max(numbers):
        max_val = numbers[0]
        for num in numbers:
            if num > max_val:
                max_val = num
        return max_val

----

Example 2
=======================

.. ordering::
    :no-solution:

    def add(num1, num2):
        return num1 + num2

    print(add(5, 3))


----

| Calculate the total perimeter and area of a rectangle in that order. The perimeter is calculated first, followed by the area.


.. ordering::

    def rect_perimeter(width, height):
        return 2 * (width + height)

    def rect_area(width, height):
        area = width * height
        return area

    print(f'Perimeter: {rect_perimeter(5, 3)}')
    print(f'Area: {rect_area(5, 3)}')



----


.. ordering::
    :theme: light

    def hello_world():
        print("Hello World")

----

.. ordering::
    :theme: dark

    def hello_world():
        print("Hello World")


