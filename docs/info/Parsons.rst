===============
Parsons puzzles
===============

This is a demo page showing how Parsons puzzles render inside Sphinx.

Parsons puzzles
---------------

.. parsons::
   :title: Build a reversed list
   :shuffle:
   :columns: 2

   - result = []
   - for x in reversed(xs):
   -     result.append(x)
   - print(result)

Another Example
---------------

.. parsons::
   :title: Calculate a factorial
   :shuffle:
   :columns: 3

   - def factorial(n):
   -     if n == 0:
   -         return 1
   -     else:
   -         return n * factorial(n-1)
   - print(factorial(5))
   :title: Build a reversed list
   :shuffle:
   :columns: 2

   - result = []
   - for x in reversed(xs):
   -     result.append(x)
   - print(result)
