Parsons Puzzles — Feature Showcase
==================================

This page demonstrates the full range of options available in the Parsons puzzle directive.

Basic Puzzle
------------

.. parsons::
   :title: Reverse a list
   :shuffle:
   :columns: 1

   - result = []
   - for x in reversed(xs):
   -     result.append(x)
   - print(result)

----

Factorial Puzzle (Strict Check)
-------------------------------

.. parsons::
   :title: Factorial function
   :shuffle:
   :columns: 1
   :check-mode: strict

   - def factorial(n):
   -     if n == 0:
   -         return 1
   -     else:
   -         return n * factorial(n-1)
   - print(factorial(5))

----

Order-Only Check
----------------

.. parsons::
   :title: Order matters, indent ignored
   :shuffle:
   :columns: 1
   :check-mode: order-only

   - for i in range(3):
   - print(i)

----

Indent-Only Check
-----------------

.. parsons::
   :title: Indentation matters, order ignored
   :shuffle:
   :columns: 1
   :check-mode: indent-only
   :indent-step: 2

   - for i in range(3):
   -     print(i)

----

Multi-Column Puzzle
-------------------

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

----

Three Column Puzzle
-------------------

.. parsons::
   :title: Three stages
   :shuffle:
   :columns: 3
   :labels: Setup, Loop, Output

   - xs = [1, 2, 3]
   - result = []
   - for x in xs:
   -     result.append(x * 2)
   - print(result)

----

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

----

Custom Buttons
--------------

.. parsons::
   :title: Custom button labels
   :shuffle:
   :columns: 1
   :buttons: Verify,Restart,Reveal

   - nums = [1, 2, 3]
   - squares = [n*n for n in nums]
   - print(squares)

----

Multi-Language Puzzle
---------------------

.. parsons::
   :title: Factorial in JavaScript
   :language: javascript
   :shuffle:
   :columns: 1

   - function factorial(n) {
   -   if (n === 0) return 1;
   -   else return n * factorial(n-1);
   - }
   - console.log(factorial(5));

----

Client-Side Shuffle
-------------------

.. parsons::
   :title: Square numbers
   :shuffle-js:
   :columns: 1

   - nums = [1, 2, 3]
   - squares = [n*n for n in nums]
   - print(squares)

----

Accessibility Note
------------------

Learners can use **keyboard navigation** as well as drag - and - drop:

- **Arrow Up/Down**: move a line within its list.
- **Arrow Left/Right**: adjust indentation.
- **Tab**: focus different lines.
