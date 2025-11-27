==================
Parsons2 puzzles
==================

This is a demo page showing how Parsons puzzles render inside Sphinx.

Build a reversed list
---------------------

.. parsons2::
   :title: Build a reversed list
   :shuffle:
   :columns: 4
   :labels: Indent 0, Indent 1, Indent 2, Indent 3
   :expected: 0::result = []|0::for x in reversed(xs):|1::result.append(x)|0::print(result)

   - result = []
   - for x in reversed(xs):
   -     result.append(x)
   - print(result

----

Calculate a factorial
---------------------

.. parsons2::
   :title: Calculate a factorial
   :shuffle:
   :columns: 4
   :labels: Indent 0, Indent 1, Indent 2, Indent 3
   :expected: 0::def factorial(n):|1::if n == 0:|2::return 1|1::else:|2::return n * factorial(n-1)|0::print(factorial(5))

   - def factorial(n):
   -     if n == 0:
   -         return 1
   -     else:
   -         return n * factorial(n-1)
   - print(factorial(5))

----

Separate Input and Output
-------------------------

.. parsons2::
   :title: Separate Input and Output
   :shuffle:
   :columns: 4
   :labels: Input, Output, Indent 2, Indent 3
   :expected: 0::xs = [1, 2, 3]|0::result = []|0::for x in xs:|1::result.append(x * 2)|0::print(result)

   - xs = [1, 2, 3]
   - result = []
   - for x in xs:
   -     result.append(x * 2)
   - print(result)

----

Sum a list (with distractors)
-----------------------------

.. parsons2::
   :title: Sum a list
   :shuffle:
   :columns: 4
   :labels: Indent 0, Indent 1, Indent 2, Indent 3
   :expected: 0::total = 0|0::for x in xs:|1::total += x|0::print(total)

   - total = 0
   - for x in xs:
   -     total += x
   - print(total)
   - print("wrong answer")   # distractor
   - xs = "not a list"       # distractor

----

Square numbers (client‑side shuffle)
------------------------------------

.. parsons2::
   :title: Square numbers
   :shuffle-js:
   :columns: 4
   :labels: Indent 0, Indent 1, Indent 2, Indent 3
   :expected: 0::nums = [1, 2, 3]|0::squares = [n*n for n in nums]|0::print(squares)

   - nums = [1, 2, 3]
   - squares = [n*n for n in nums]
   - print(squares)
