================================================
Multi-Choice Directive Documentation
================================================

The multichoice directive creates an interactive multiple-choice question format. Users can select one or more choices, validate their answers, and receive instant feedback alongside custom written explanations.

Syntax
-------------------

.. code-block:: rst

    .. multichoice::

        Question text goes here...

        [x] Correct option text | Feedback message for correct answer.
        [ ] Incorrect option text | Feedback message for incorrect answer.

Options for the multichoice directive
--------------------------------------

.. list-table::
   :widths: 35 10 55
   :header-rows: 1

   * - Option
     - Type
     - Description
   * - ``:delimiter:``
     - string
     - | Sets the delimiter between the option text and the feedback message.
       | e.g @@  The default is ``|`` (pipe).
   * - ``:no-letters:``
     - flag
     - If present, hides the alphabetical choice indicators (A, B, C...).
   * - ``:no-shuffle:``
     - flag
     - | If present, forces the multiple choice options to
       | stay fixed in their declared order instead of being randomized.
   * - ``:theme:``
     - string
     - | If present, set the visual theme.
       | Options are ``white`` (default) or ``light``.


| Shuffling: Unless ``:no-shuffle:`` is declared, choices are automatically randomized on page render and on Reset button clicks to elimin  position-based pattern guessing.
| Selection Engine: The directive automatically changes selection inputs from single-choice radio buttons to multi-choice checkboxes if more than one option is marked correct ``[x]``.
| Visual Badges: Once the evaluation button is selected, clear inline indicator icons (✓, ✕) show up next to each answer option along with context explanations.

----

Example 1: Single Correct (Default)
------------------------------------

| The default configuration renders with automatic letter assignments (A, B, C...) and randomized positioning.

.. code-block:: rst

    .. multichoice::

        Which of these does an equality check in Python?

        [x] == | Correct.
        [ ] = | Incorrect. That does assignment
        [ ] !== | Incorrect. Not equals to
        [ ] <= | Incorrect. Less than or equals to

.. multichoice::

    Which of these does an equality check in Python?

    [x] == | Correct.
    [ ] = | Incorrect. That does assignment
    [ ] !== | Incorrect. Not equals to
    [ ] <= | Incorrect. Less than or equals to

----

Example 2: Single Correct (No Letters)
---------------------------------------

| The following example demonstrates hiding the prefix alphabetical list labeling characters by using the ``:no-letters:`` option flag.

.. code-block:: rst

    .. multichoice::
        :no-letters:

        What is the correct way to print "Hello, World" in Python?

        [x] print("Hello, World") | Correct. print requires brackets.
        [ ] print "Hello, World"
        [ ] echo "Hello, World"
        [ ] echo(Hello, World)

.. multichoice::
    :no-letters:

    What is the correct way to print "Hello, World" in Python?

    [x] print("Hello, World") | Correct. print requires brackets.
    [ ] print "Hello, World"
    [ ] echo "Hello, World"
    [ ] echo(Hello, World)

----

Example 3: Single Correct (Unshuffled)
---------------------------------------

| The following example demonstrates freezing the item choices in their explicitly declared ordering layout via the ``:no-shuffle:`` option flag.

.. code-block:: rst

    .. multichoice::
        :no-shuffle:

        Which of these are valid variable names in Python?

        [x] my_var | Correct. Valid variable name
        [ ] var | Incorrect. Cannot start with a number
        [ ] @var | Incorrect. Cannot start with a symbol
        [ ] my-var | Incorrect. Hyphens are not allowed

.. multichoice::
    :no-shuffle:

    Which of these are valid variable names in Python?

    [x] my_var | Correct. Valid variable name
    [ ] var | Incorrect. Cannot start with a number
    [ ] @var | Incorrect. Cannot start with a symbol
    [ ] my-var | Incorrect. Hyphens are not allowed

----

Example 4: Code Block Layout Inside Question
--------------------------------------------

| The following example demonstrates how to include a code block inside the question text.
| light theme is used here to better highwhite the code snippet.

.. code-block:: rst

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

----

Example 5: Code Block Layout Inside Responses
------------------------------------------------

| The following example demonstrates how to include a code block inside the response text.

.. code-block:: rst

    .. multichoice::

        A student wants to display the word "ABC" such that the final character 'C' is removed right away, followed by a brief half-second pause. Which option is correct?
        [ ] .. code-block:: python

                display.show("ABC")
                sleep(500)
            | Incorrect. This does not use clear parameters or clear commands, leaving 'C' stuck on screen.
        [x] .. code-block:: python

                display.show("ABC", clear=True)
                sleep(500)
            | Correct. It automatically removes the last character via clear=True and pauses for 500ms (half a second).
        [ ] .. code-block:: python

                display.show("ABC", clear=False)
                sleep(50)
            | Incorrect. This explicitly stops the character from being cleared, and pauses for only 50ms.
        [ ] .. code-block:: python

                display.show("ABC", delay=500)
            | Incorrect. This merely slows the timing between characters to 500ms instead of creating a final blank screen pause.


.. multichoice::

    A student wants to display the word "ABC" such that the final character 'C' is removed right away, followed by a brief half-second pause. Which option is correct?
    [ ] .. code-block:: python

            display.show("ABC")
            sleep(500)
        | Incorrect. This does not use clear parameters or clear commands, leaving 'C' stuck on screen.
    [x] .. code-block:: python

            display.show("ABC", clear=True)
            sleep(500)
        | Correct. It automatically removes the last character via clear=True and pauses for 500ms (half a second).
    [ ] .. code-block:: python

            display.show("ABC", clear=False)
            sleep(50)
        | Incorrect. This explicitly stops the character from being cleared, and pauses for only 50ms.
    [ ] .. code-block:: python

            display.show("ABC", delay=500)
        | Incorrect. This merely slows the timing between characters to 500ms instead of creating a final blank screen pause.


----

Example 6: Multi-lines
--------------------------------

| The following example demonstrates how to structure multi-line text inside options and feedback for a science inquiry question.

.. code-block:: rst

    .. multichoice::
        :delimiter: @@

        A group of Year 7 students is measuring the mass of water during a chemistry experiment.
        Before placing the beaker on the digital balance, they forget to press the **tare** (zero) button, so the scale displays `2.5 g` while empty.

        Which of the following best describes the effect this mistake has on their measurements and how it should be categorized?

        [ ] It is a random error because the readings will fluctuate unpredictably above and below the true mass. To fix this, the students should repeat the experiment three times and calculate an average.
            @@ | Incorrect. Forgetting to zero the scale shifts all readings in the exact same direction (too high by 2.5 g).
               | Random errors shift measurements in unpredictable directions, whereas this shift is predictable and constant.

        [x] It is a systematic error because every single mass reading will be exactly 2.5 grams higher than the actual mass. To correct the data, the students must subtract 2.5 grams from each recorded reading.
            @@ | Correct! Systematic errors consistently offset measurements in one direction.
               | Because the scale reads 2.5 g when empty, every measurement taken will be over the true value by that precise amount.

        [ ] It is a systematic error because the scale is broken and will give different random values every time a new beaker is placed on it. The students must throw away the balance and start the experiment again with a new one.
            @@ | Incorrect. Systematic errors are consistent offset errors, not unpredictable variations.
               | The balance is not broken; it simply needs to be zeroed or have the offset mathematically subtracted from the readings.

        [ ] It is neither an error nor a mistake, because the mass of the glass beaker always needs to be added to the final result anyway. The recorded masses will be completely accurate without any adjustment.
            @@ Incorrect. If you do not subtract the empty beaker's starting offset, you are measuring the beaker's mass alongside the liquid, which distorts the experimental results.


.. multichoice::
    :delimiter: @@

    A group of Year 7 students is measuring the mass of water during a chemistry experiment.
    Before placing the beaker on the digital balance, they forget to press the **tare** (zero) button, so the scale displays `2.5 g` while empty.

    Which of the following best describes the effect this mistake has on their measurements and how it should be categorized?

    [ ] It is a random error because the readings will fluctuate unpredictably above and below the true mass. To fix this, the students should repeat the experiment three times and calculate an average.
        @@ | Incorrect. Forgetting to zero the scale shifts all readings in the exact same direction (too high by 2.5 g).
           | Random errors shift measurements in unpredictable directions, whereas this shift is predictable and constant.

    [x] It is a systematic error because every single mass reading will be exactly 2.5 grams higher than the actual mass. To correct the data, the students must subtract 2.5 grams from each recorded reading.
        @@ | Correct! Systematic errors consistently offset measurements in one direction.
           | Because the scale reads 2.5 g when empty, every measurement taken will be over the true value by that precise amount.

    [ ] It is a systematic error because the scale is broken and will give different random values every time a new beaker is placed on it. The students must throw away the balance and start the experiment again with a new one.
        @@ | Incorrect. Systematic errors are consistent offset errors, not unpredictable variations.
           | The balance is not broken; it simply needs to be zeroed or have the offset mathematically subtracted from the readings.

    [ ] It is neither an error nor a mistake, because the mass of the glass beaker always needs to be added to the final result anyway. The recorded masses will be completely accurate without any adjustment.
        @@ Incorrect. If you do not subtract the empty beaker's starting offset, you are measuring the beaker's mass alongside the liquid, which distorts the experimental results.



----

Example 7: Multiple Correct Answers
-----------------------------------

| Checking more than one correct bracket item ``[x]`` automatically swaps from a radio selections to checkboxes.

.. code-block:: rst

    .. multichoice::

        Which of the following are Python data types?

        [x] int | Integer type
        [x] str | String type
        [ ] html | Not a Python type
        [x] float | Floating-point number

.. multichoice::

    Which of the following are Python data types?

    [x] int | Integer type
    [x] str | String type
    [ ] html | Not a Python type
    [x] float | Floating-point number

----

Example 8: Delimter
------------------------------------

| The delimiter by default is a pipe ``|``, It can be set to a string like ``@@``.

.. code-block:: rst

    .. multichoice::
        :delimiter: @@

        Which of these does an equality check in Python?

        [x] == @@ Correct.
        [ ] = @@ Incorrect. That does assignment
        [ ] !== @@ Incorrect. Not equals to
        [ ] <= @@ Incorrect. Less than or equals to

.. multichoice::
    :delimiter: @@

    Which of these does an equality check in Python?

    [x] == @@ Correct.
    [ ] = @@ Incorrect. That does assignment
    [ ] !== @@ Incorrect. Not equals to
    [ ] <= @@ Incorrect. Less than or equals to