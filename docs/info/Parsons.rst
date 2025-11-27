===============
Parsons puzzles
===============

This is a demo page showing how Parsons puzzles render inside Sphinx.

Parsons puzzles
---------------

.. parsons::
   :title: Build a reversed list
   :shuffle:
   :columns: 1

   - result = []
   - for x in reversed(xs):
   -     result.append(x)
   - print(result)

----

Another Example
---------------

.. parsons::
   :title: Calculate a factorial
   :shuffle:
   :columns: 1

   - def factorial(n):
   -     if n == 0:
   -         return 1
   -     else:
   -         return n * factorial(n-1)
   - print(factorial(5))


----


Two Column Puzzle
-----------------

.. parsons::
   :title: Separate Input and Output
   :shuffle:
   :columns: 2
   :labels: Input, Output

   - xs = [1, 2, 3]
   - result = []
   - for x in xs:
   -     result.append(x * 2)
   - print(result)


Puzzle with Distractors
-----------------------

.. parsons::
   :title: Sum a list
   :shuffle:
   :columns: 1

   - total = 0
   - for x in xs:
   -     total += x
   - print(total)
   - print("wrong answer")   # distractor
   - xs = "not a list"       # distractor


Client‑Side Shuffle
-------------------

.. parsons::
   :title: Square numbers
   :shuffle-js:
   :columns: 1

   - nums = [1, 2, 3]
   - squares = [n*n for n in nums]
   - print(squares)
 -