================================================
Python Data Structures: Gap-Fill Practice
================================================

Test your understanding of Python lists and dictionaries by filling in the blanks or choosing the correct syntax options below.

Exercise 1: List Basics
=======================
This section covers initializing, modifying, and measuring Python lists.

.. gapfill::

   To create an empty list named ``fruits``, you write:
   fruits = []

   If you want to add "apple" to the end of that list, use the method:
   fruits.append("apple")

   To find out how many items are currently in your list, you wrap it in the *[len/length/count]* function.

Exercise 2: List Slicing & Indices (3 Choices)
==============================================
Test your index knowledge. Remember that Python uses zero-based indexing!

.. gapfill::

   Consider the list: ``numbers = [10, 20, 30, 40, 50]``

   To access the very first element (10), you use the index:
   first_item = numbers[*[0/1/-1]*]

   To get the last element (50) dynamically without knowing the length, use a negative index:
   last_item = numbers[*[-1/-2/-3]*]

   To slice the list and get ``[20, 30, 40]``, your start and stop bounds must be:
   sub_list = numbers[*[1:4/1:3/0:3]*]

Exercise 3: Dictionary Basics (2 Choices)
=========================================
Dictionaries store data in key-value pairs.

.. gapfill::

   Dictionaries are defined using *[curly braces / square brackets]*.

   Let's create a profile dictionary:
   user = {"name": "Alice", "age": 30}

   In this dictionary, "name" and "age" are the *[keys/values]*, while "Alice" and 30 are the values.

   If you try to access a key that doesn't exist using ``user["id"]``, Python throws a *[KeyError/ValueError]*.

Exercise 4: Advanced Dictionary Methods (4 Choices)
===================================================
This exercise tests safety methods, removing items, and extraction loops using a 4-choice dropdown layout.

.. gapfill::

   To safely fetch a value from a dictionary without risking a crash if the key is missing, you should use the *[get/fetch/retrieve/extract]* method.

   If you want to completely remove a key-value pair and capture its value at the same time, use the *[pop/remove/delete/discard]* method.

   To loop through both the keys and the values simultaneously in a ``for`` loop, you must chain the *[items()/keys()/values()/pairs()]* method onto your dictionary variable.

Exercise 5: Mixed Syntax Challenge
==================================
A final rapid-fire mix of free-text entry inputs and dropdown choices.

.. gapfill::

   If you want to completely empty all elements from a list or dictionary, use the [clear] method.

   Lists are mutable, meaning they can be changed, while *[tuples/strings/sets]* are an example of an immutable sequence type.

   To sort a list in-place permanently, use the [sort] method, but to return a new sorted copy without changing the original list, use the *[sorted/sort_new/arrange]* function.



