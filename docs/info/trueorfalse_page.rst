==============================================================
True or False using Multi-Choice-Page Directive Documentation
==============================================================

The ``multichoicepage`` directive can create interactive True/False questions. Each question includes its own dedicated check control, reset button, and immediate feedback.

Syntax
-------------------

.. code-block:: rst

    .. multichoicepage::
        :torf:

        Question text goes here...

        [x] True | Explanation if True is correct.
        [ ] False | Explanation if False is incorrect.


| The ``:torf:`` option is required to specify that the directive is a True/False question.
| It causes the True option to always be first, and the False option to always be second.

----

Example 1: Basic True / False (Equality Check)
----------------------------------------------

| Standard True/False statement with custom explanations.

.. code-block:: rst

    .. multichoicepage::
        :torf:

        In Python, the `==` operator is used to perform an equality check.

        [x] True | Correct! `==` compares values for equality, whereas `=` is used for variable assignment.
        [ ] False | Incorrect. `==` is indeed the equality operator in Python.

.. multichoicepage::
    :torf:

    In Python, the `==` operator is used to perform an equality check.

    [x] True | Correct! `==` compares values for equality, whereas `=` is used for variable assignment.
    [ ] False | Incorrect. `==` is indeed the equality operator in Python.

----

Example 2: String Output Syntax
-------------------------------

| Testing print syntax in modern Python.

.. code-block:: rst

    .. multichoicepage::
        :torf:

        In Python 3, `print "Hello, World"` is valid syntax.

        [ ] True | Incorrect. Python 3 requires parentheses for functions: `print("Hello, World")`.
        [x] False | Correct! Python 3 treats `print()` as a function requiring parentheses.

.. multichoicepage::
    :torf:

    In Python 3, `print "Hello, World"` is valid syntax.

    [ ] True | Incorrect. Python 3 requires parentheses for functions: `print("Hello, World")`.
    [x] False | Correct! Python 3 treats `print()` as a function requiring parentheses.

----

Example 4: Code Block Layout Inside Question (Exponentiation)
-------------------------------------------------------------

| Code blocks embedded directly within statement text.

.. code-block:: rst

    .. multichoicepage::
        :torf:
        :theme: light

        Will the following Python code output `25`?

        .. code-block:: python

            x = 5
            y = 2
            print(x ** y)

        [x] True | Correct! `**` is the exponentiation operator in Python (5^2 = 25).
        [ ] False | Incorrect. `**` calculates powers, so 5 raised to 2 is 25.

.. multichoicepage::
    :torf:
    :theme: light

    Will the following Python code output `25`?

    .. code-block:: python

        x = 5
        y = 2
        print(x ** y)

    [x] True | Correct! `**` is the exponentiation operator in Python (5^2 = 25).
    [ ] False | Incorrect. `**` calculates powers, so 5 raised to 2 is 25.

----

Example 5: Memory Identity with Objects
---------------------------------------

| Testing list memory allocations with the `is` operator.

.. code-block:: rst

    .. multichoicepage::
        :torf:
        :theme: light

        Will the following Python code evaluate to `True`?

        .. code-block:: python

            a = [1, 2, 3]
            b = [1, 2, 3]
            print(a is b)

        [ ] True | Incorrect. `is` checks memory identity; `a` and `b` are two distinct list instances.
        [x] False | Correct! `a` and `b` contain identical elements, but occupy different memory locations.

.. multichoicepage::
    :torf:
    :theme: light

    Will the following Python code evaluate to `True`?

    .. code-block:: python

        a = [1, 2, 3]
        b = [1, 2, 3]
        print(a is b)

    [ ] True | Incorrect. `is` checks memory identity; `a` and `b` are two distinct list instances.
    [x] False | Correct! `a` and `b` contain identical elements, but occupy different memory locations.

----

Example 6: Display Parameters & Delays
--------------------------------------

| Evaluating code blocks with keyword argument options.

.. code-block:: rst

    .. multichoicepage::
        :torf:

        Does the following code correctly show "ABC", clear it immediately, and pause for half a second?

        .. code-block:: python

            display.show("ABC", clear=True)
            sleep(500)

        [x] True | Correct! `clear=True` wipes the display after showing, and `sleep(500)` pauses for 500 ms.
        [ ] False | Incorrect. This code executes all required steps accurately.

.. multichoicepage::
    :torf:

    Does the following code correctly show "ABC", clear it immediately, and pause for half a second?

    .. code-block:: python

        display.show("ABC", clear=True)
        sleep(500)

    [x] True | Correct! `clear=True` wipes the display after showing, and `sleep(500)` pauses for 500 ms.
    [ ] False | Incorrect. This code executes all required steps accurately.

----

Example 7: Multi-line Explanations (Scientific Data Analysis)
-------------------------------------------------------------

| Multi-line explanations provided for both outcomes.

.. code-block:: rst

    .. multichoicepage::
        :torf:
        :delimiter: @@

        Forgetting to tare (zero) a balance before taking mass measurements introduces a systematic error rather than a random error.

        [x] True
            @@ | Correct! Systematic errors shift all measurements consistently in one direction.
               | Because the starting offset is constant, every reading will be higher than the true mass by that exact amount.

        [ ] False
            @@ | Incorrect. Random errors cause unpredictable fluctuations above and below the true value.
               | A non-zeroed scale causes a predictable, constant offset, which defines a systematic error.

.. multichoicepage::
    :torf:
    :delimiter: @@

    Forgetting to tare (zero) a balance before taking mass measurements introduces a systematic error rather than a random error.

    [x] True
        @@ | Correct! Systematic errors shift all measurements consistently in one direction.
           | Because the starting offset is constant, every reading will be higher than the true mass by that exact amount.

    [ ] False
        @@ | Incorrect. Random errors cause unpredictable fluctuations above and below the true value.
           | A non-zeroed scale causes a predictable, constant offset, which defines a systematic error.

----

Example 8: Python Data Types
----------------------------

| Verifying core primitive data types in Python.

.. code-block:: rst

    .. multichoicepage::
        :torf:

        In Python, `int`, `str`, and `float` are primitive data types, while `html` is a standard built-in type.

        [ ] True | Incorrect. `html` is not a built-in Python data type.
        [x] False | Correct! `int`, `str`, and `float` are native types, but `html` is not.

.. multichoicepage::
    :torf:

    In Python, `int`, `str`, and `float` are primitive data types, while `html` is a standard built-in type.

    [ ] True | Incorrect. `html` is not a built-in Python data type.
    [x] False | Correct! `int`, `str`, and `float` are native types, but `html` is not.

----

Example 9: Custom Pipe Delimiters inside Code Statements
--------------------------------------------------------

| Using custom delimiters (`:delimiter: @@`) when statement choices contain pipe symbols (`|`).

.. code-block:: rst

    .. multichoicepage::
        :torf:
        :delimiter: @@

        The expression `{1, 2} | {2, 3}` computes the union of two Python set objects, evaluating to `{1, 2, 3}`.

        [x] True @@ Correct! The `|` operator computes set union in Python.
        [ ] False @@ Incorrect. `|` is indeed the set union operator.

.. multichoicepage::
    :torf:
    :delimiter: @@

    The expression `{1, 2} | {2, 3}` computes the union of two Python set objects, evaluating to `{1, 2, 3}`.

    [x] True @@ Correct! The `|` operator computes set union in Python.
    [ ] False @@ Incorrect. `|` is indeed the set union operator.

----

Example 10: Collection Bracket Enclosures
-----------------------------------------

| Testing usage of parentheses `()`, square brackets `[]`, and curly braces `{}`.

.. code-block:: rst

    .. multichoicepage::
        :torf:

        In Python, `[1, 2]` declares a list, `(1, 2)` declares a tuple, and `{"a": 1}` declares a dictionary.

        [x] True | Correct! Square brackets denote lists, parentheses denote tuples, and curly braces with key-value pairs denote dictionaries.
        [ ] False | Incorrect. All three syntax forms correctly map to their respective collection types.

.. multichoicepage::
    :torf:

    In Python, `[1, 2]` declares a list, `(1, 2)` declares a tuple, and `{"a": 1}` declares a dictionary.

    [x] True | Correct! Square brackets denote lists, parentheses denote tuples, and curly braces with key-value pairs denote dictionaries.
    [ ] False | Incorrect. All three syntax forms correctly map to their respective collection types.

----

Example 11: Complex Nested Bracket Indexing
-------------------------------------------

| Testing nested data structure access combining dictionaries, lists,    and tuples.

.. code-block:: rst

    .. multichoicepage::
        :torf:
        :theme: light

        Given the data structure below, does `data["users"][0]["scores"][1]` evaluate to `90`?

        .. code-block:: python

            data = {
                "users": [
                    {"name": "Alice", "scores": (85, 90)},
                    {"name": "Bob", "scores": (78, 88)}
                ]
            }

        [x] True | Correct! `["users"]` gets the list, `[0]` gets Alice, `["scores"]` gets her tuple, and `[1]` gets `90`.
        [ ] False | Incorrect. Navigating dict keys and list/tuple indices in this sequence correctly reaches `90`.

.. multichoicepage::
    :torf:
    :theme: light

    Given the data structure below, does `data["users"][0]["scores"][1]` evaluate to `90`?

    .. code-block:: python

        data = {
            "users": [
                {"name": "Alice", "scores": (85, 90)},
                {"name": "Bob", "scores": (78, 88)}
            ]
        }

    [x] True | Correct! `["users"]` gets the list, `[0]` gets Alice, `["scores"]` gets her tuple, and `[1]` gets `90`.
    [ ] False | Incorrect. Navigating dict keys and list/tuple indices in this sequence correctly reaches `90`.

