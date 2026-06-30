

================================================
Python Data Structures: Ordering
================================================

Test your understanding of Python by arranging the code snippets in the correct order to form a working function.

Exercise 1
=======================

Reorder the following code snippets to create a function that finds the maximum value in a list of numbers.


.. ordering::

    def find_max(numbers):
        max_val = numbers[0]
        for num in numbers:
            if num > max_val:
                max_val = num
        return max_val

----


.. ordering::
    :theme: light
    :no-solution:

    def add(num1, num2):
        return num1 + num2

    print(add(5, 3))


----

| Calculate the total perimeter and area of a rectangle in that order. The perimeter is calculated first, followed by the area.


.. ordering::
    :theme: light

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

    def say_hello():
        msg = "Hi!"
        print(msg)

----

.. ordering::

    def hello_world():
        print("Hello World")

----

.. ordering::
    :theme: dark

    def hello_world():
        print("Hello World")


