=============================
MCQ Score Directive Reference
=============================

The ``.. mcqscore::`` directive creates interactive, auto-scoring multiple-choice questions natively within your documentation. It automatically detects single-select (radio buttons) or multiple-select (checkboxes) based on the number of correct answers provided.

Directive Structure
===================

.. code-block:: rst

    .. mcqscore::
       :no-shuffle:
       :no-letters:

       Question text goes here. Supports **bold**, `code`, and blocks.

       [ ] Choice 1 | Optional inline explanation
       [x] Choice 2 | Correct answer explanation

Configuration Options
=====================

* **Default:** Shuffles choices and assigns labels (A, B, C...) via CSS/JS.
* ``:no-shuffle:``: Maintains the exact order defined in the source file.
* ``:no-letters:``: Removes automatic lettering (best for numeric or True/False).

Syntax Rules
============

.. tip::
   Always leave a blank line between the end of your question text and the start of your choices to ensure correct parsing.

1.  **Question Body:** Supports standard reStructuredText, including headers, lists, and nested directives (e.g., ``.. code-block::``).
2.  **Choice Markers:** * Use ``[ ]`` (empty space) for an **incorrect** choice.
    * Use ``[x]`` or ``[X]`` for a **correct** choice.
3.  **Explanations:** Add a pipe (``|``) after the choice text. Content following the pipe is treated as hidden feedback revealed upon submission.

Examples
========

Single-Choice with Code Block
-----------------------------

.. code-block:: rst

    .. mcqscore::

        What does the following Python expression return?

        .. code-block:: python

            print(10 // 3)

        [ ] 3.3333 | Incorrect: This is the result of ``/``.
        [x] 3      | Correct: The ``//`` operator performs floor division.
        [ ] 1      | Incorrect: This is the result of the ``%`` operator.


Multiple-Choice (Shuffled)
--------------------------

.. code-block:: rst

    .. mcqscore::

        Which of the following are valid Python data types?

        [x] int    | Correct: Standard integer type.
        [x] dict   | Correct: Mapping type.
        [ ] html   | Incorrect: This is a markup language.
        [x] list   | Correct: Mutable sequence type.

