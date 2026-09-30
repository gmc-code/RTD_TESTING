==============================================================
True or False using Multi-Choice-Group Directive Documentation
==============================================================

The ``mcqgroup`` directive can create interactive True/False questions. Each question includes its own dedicated check control, reset button, and immediate feedback.

----

Example
----------------------------------------------

| The following example demonstrates a group of True/False questions.

.. code-block:: rst

    .. mcqgroup::

        .. multichoice::
            :torf:

            In Python, the `==` operator is used to perform an equality check.

            [x] True | Correct! `==` compares values for equality, whereas `=` is used for variable assignment.
            [ ] False | Incorrect. `==` is indeed the equality operator in Python.

        .. multichoice::
            :torf:

            In Python 3, `print "Hello, World"` is valid syntax.

            [ ] True | Incorrect. Python 3 requires parentheses for functions: `print("Hello, World")`.
            [x] False | Correct! Python 3 treats `print()` as a function requiring parentheses.

.. mcqgroup::

    .. multichoice::
        :torf:

        In Python, the `==` operator is used to perform an equality check.

        [x] True | Correct! `==` compares values for equality, whereas `=` is used for variable assignment.
        [ ] False | Incorrect. `==` is indeed the equality operator in Python.

    .. multichoice::
        :torf:

        In Python 3, `print "Hello, World"` is valid syntax.

        [ ] True | Incorrect. Python 3 requires parentheses for functions: `print("Hello, World")`.
        [x] False | Correct! Python 3 treats `print()` as a function requiring parentheses.
