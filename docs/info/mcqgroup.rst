================================================
Multi-Choice Group Directive
================================================

| The mcqgroup directive creates a group of multiple-choice questions.
| It is used to group related questions together and provide a unified interface for students to answer them.
| It is a container directive, which means that it can contain multiple instances of the multichoice directive.
| Since true/false questions are a special case of multiple-choice questions, the mcqgroup directive can also contain true/false questions as well.

----

Syntax
-------------------

.. code-block:: rst

    .. mcqgroup::

        .. multichoice::
            :theme: light

            Which component of a plant cell makes energy?

            [ ] Chloroplast  | Incorrect.
            [x] Mitochondria | Correct!

----

Options for the mcqgroup directive
--------------------------------------

.. list-table::
   :widths: 35 10 15 40
   :header-rows: 1

   * - Option
     - Type
     - Default
     - Description
   * - | ``:nav-position:`` /
       | ``:nav_position:``
     - String
     - bottom
     - Sets the position of the navigation controls. Valid values are "top" or "bottom" or "both".
   * - | ``:show-instant-feedback:`` /
       | ``:show_instant_feedback:``
     - Flag
     - Off
     - Displays the "Instant Feedback" checkbox control in the group action bar.
   * - | ``:enable-instant-feedback:`` /
       | ``:enable_instant_feedback:``
     - Flag
     - Off
     - Causes the "Instant Feedback" checkbox to be checked by default when displayed.
   * - | ``:shuffle-questions:`` /
       | ``:shuffle_questions:``
     - Flag
     - Off
     - Randomizes the order of questions in the group.
   * - | ``:num-questions:`` /
       | ``:num_questions:``
     - Integer
     - All questions
     - Limits the number of questions displayed in the group. If set, a random subset of questions will be shown.


----

Grouped Multiple Choice
---------------------------------------------------

.. code-block:: rst

    .. mcqgroup::
        :nav_position: both
        :show-instant-feedback:
        :enable-instant-feedback:
        :shuffle_questions:
        :num_questions: 3

        .. multichoice::
            :theme: light

            Which component of a plant cell makes energy?

            [ ] Chloroplast  | Incorrect. Chloroplast make sugars through photosynthesis.
            [x] Mitochondria | Correct! Mitochondria is the powerhouse of the cell.

        .. multichoice::

            What is the chemical symbol for Silver?

            [x] Ag | Correct! Ag is the chemical symbol for Silver.
            [ ] S | Incorrect. S is the chemical symbol for Sulfur.


        .. multichoice::
            :torf:

            In Python, the `==` operator is used to perform an equality check.

            [x] True | Correct! `==` compares values for equality, whereas `=` is used for variable assignment.
            [ ] False | Incorrect. `==` is indeed the equality operator in Python.

        .. multichoice::
            :no-letters:

            What is the correct way to print "Hello, World" in Python?

            [x] print("Hello, World") | Correct. print requires brackets.
            [ ] print "Hello, World"
            [ ] echo "Hello, World"

        .. multichoice::
            :no-shuffle:

            Which of these are valid variable names in Python?

            [x] my_var | Correct. Valid variable name
            [ ] 2var | Incorrect. Cannot start with a number
            [ ] @var | Incorrect. Cannot start with a symbol
            [ ] my-var | Incorrect. Hyphens are not allowed

        .. multichoice::
            :theme: light

            What is the output of the following code?

            .. code-block:: python

                x = 5
                y = 2
                print(x ** y)

            [x] 25 | Correct: `**` is exponentiation, so output is 25
            [ ] 5^2
            [ ] 10
            [ ] 7

        .. multichoice::

            Which of the following are Python data types?

            [x] int | Integer type
            [x] str | String type
            [ ] html | Not a Python type
            [x] float | Floating-point number


.. mcqgroup::
    :nav_position: both
    :show-instant-feedback:
    :enable-instant-feedback:
    :shuffle_questions:
    :num_questions: 3

    .. multichoice::
        :theme: light

        Which component of a plant cell makes energy?

        [ ] Chloroplast  | Incorrect. Chloroplast make sugars through photosynthesis.
        [x] Mitochondria | Correct! Mitochondria is the powerhouse of the cell.

    .. multichoice::

        What is the chemical symbol for Silver?

        [x] Ag | Correct! Ag is the chemical symbol for Silver.
        [ ] S | Incorrect. S is the chemical symbol for Sulfur.


    .. multichoice::
        :torf:

        In Python, the `==` operator is used to perform an equality check.

        [x] True | Correct! `==` compares values for equality, whereas `=` is used for variable assignment.
        [ ] False | Incorrect. `==` is indeed the equality operator in Python.

    .. multichoice::
        :no-letters:

        What is the correct way to print "Hello, World" in Python?

        [x] print("Hello, World") | Correct. print requires brackets.
        [ ] print "Hello, World"
        [ ] echo "Hello, World"

    .. multichoice::
        :no-shuffle:

        Which of these are valid variable names in Python?

        [x] my_var | Correct. Valid variable name
        [ ] 2var | Incorrect. Cannot start with a number
        [ ] @var | Incorrect. Cannot start with a symbol
        [ ] my-var | Incorrect. Hyphens are not allowed

    .. multichoice::
        :theme: light

        What is the output of the following code?

        .. code-block:: python

            x = 5
            y = 2
            print(x ** y)

        [x] 25 | Correct: `**` is exponentiation, so output is 25
        [ ] 5^2
        [ ] 10
        [ ] 7

    .. multichoice::

        Which of the following are Python data types?

        [x] int | Integer type
        [x] str | String type
        [ ] html | Not a Python type
        [x] float | Floating-point number

