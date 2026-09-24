================================================
Structured Question Directive Documentation
================================================

The structuredquestion directive creates interactive exam-style questions with sub-questions, model answers, marking guidance, and self-grading controls.
Students can type responses into workspaces, reveal model answers, and track their total score.

Syntax
-------------------

.. code-block:: rst

    .. structuredquestion:: Question Title
        :total-marks: 8
        :category: Subject Area

        .. stimulus::
            Optional context, scenario, or stimulus material for the question.

        .. subquestion:: Sub-question Title
            :marks: 2

            Sub-question prompt goes here.

            .. model-answer::
                Model answer content goes here.

            .. marking-guidance::
                Marking criteria or guidance goes here.


Options for the structuredquestion directive
--------------------------------------------

.. list-table::
   :widths: 25 10 65
   :header-rows: 1

   * - Option
     - Type
     - Description
   * - ``:total-marks:``
     - integer
     - Total available marks for the entire question container (default: ``0``).
   * - ``:category:``
     - string
     - Optional topic or subject category displayed as a header badge.


Options for nested directives
-----------------------------

.. list-table::
   :widths: 40 20 10 20
   :header-rows: 1

   * - Directive
     - Option
     - Type
     - Description
   * - ``.. subquestion::``
     - ``:marks:``
     - integer
     - Marks allocated to this sub-question (default: ``1``).
   * - ``.. stimulus::``
     - *None*
     - N/A
     - Holds context or scenario text displayed in a highlighted box.
   * - ``.. model-answer::``
     - *None*
     - N/A
     - Contains sample responses shown when toggled.
   * - ``.. marking-guidance::``
     - *None*
     - N/A
     - Contains teacher/marker rubric shown when toggled.

| Structure: A ``structuredquestion`` contains one or more ``subquestion`` directives, optionally grouped inside tab sets.
| Self-Grading: Revealing the model answer displays interactive mark buttons matching the ``:marks:`` option.
| Print Friendly: When printing, everything except the structured questions (navigation, other page content, answers, and buttons) is hidden, and all tabbed sub-questions are expanded sequentially. Every structuredquestion on the page is printed, in order.
----

Example 1: Single Sub-Question
------------------------------------

| The following example demonstrates a basic single-part structured question.

.. code-block:: rst

    .. structuredquestion:: Data Representation
        :total-marks: 2
        :category: Computer Science

        .. subquestion:: Binary Conversion
            :marks: 2

            Convert the decimal number **13** into 8-bit binary.

            .. model-answer::
                The binary equivalent is **00001101**. *(2 marks)*

            .. marking-guidance::
                - 1 mark for correct representation (1101).
                - 1 mark for full 8-bit padding (00001101).

.. structuredquestion:: Data Representation
    :total-marks: 2
    :category: Computer Science

    .. subquestion:: Binary Conversion
        :marks: 2

        Convert the decimal number **13** into 8-bit binary.

        .. model-answer::
            The binary equivalent is **00001101**. *(2 marks)*

        .. marking-guidance::
            - 1 mark for correct representation (1101).
            - 1 mark for full 8-bit padding (00001101).

----

Example 2: Question with Stimulus
------------------------------------

| Use the ``.. stimulus::`` directive to provide a scenario or contextual background.

.. code-block:: rst

    .. structuredquestion:: Ohm's Law Investigation
        :total-marks: 3
        :category: Physics

        .. stimulus::
            A student connects a 12V DC power supply across a fixed resistor of 4 Ω and measures the current flowing through the circuit.

        .. subquestion:: Calculate Current
            :marks: 3

            Calculate the current flowing through the resistor, stating the equation used and the correct unit.

            .. model-answer::
                - Equation: :math:`I = \frac{V}{R}` *(1 mark)*
                - Calculation: :math:`I = \frac{12}{4} = 3\text{ A}` *(1 mark)*
                - Unit: Amperes (A) *(1 mark)*

            .. marking-guidance::
                Accept I = V / R. Do not penalize if unit symbol 'A' is lowercase.

.. structuredquestion:: Ohm's Law Investigation
    :total-marks: 3
    :category: Physics

    .. stimulus::
        A student connects a 12V DC power supply across a fixed resistor of 4 Ω and measures the current flowing through the circuit.

    .. subquestion:: Calculate Current
        :marks: 3

        Calculate the current flowing through the resistor, stating the equation used and the correct unit.

        .. model-answer::
            - Equation: :math:`I = \frac{V}{R}` *(1 mark)*
            - Calculation: :math:`I = \frac{12}{4} = 3\text{ A}` *(1 mark)*
            - Unit: Amperes (A) *(1 mark)*

        .. marking-guidance::
            Accept I = V / R.

----

Example 3: Tabbed Multi-Part Question
--------------------------------------------------

| Combine ``structuredquestion`` with ``sphinx-design`` tab sets to separate multi-part exam questions.

.. code-block:: rst

    .. structuredquestion:: Zero Error Investigation
        :total-marks: 8
        :category: Experimental Errors

        .. stimulus::
            A Year 8 class is investigating how the mass of a paper cup changes when different volumes of water are added to it. Before beginning, the teacher instructs students to place the empty cup on the balance and record the starting mass. One group notices their balance displays **0.4 g** before they place anything on it. They do not adjust the balance and proceed to record all their measurements.

        .. tab-set::

            .. tab-item:: Part (a)

                .. subquestion:: Identify the error
                    :marks: 2

                    Identify the type of error present in this investigation and classify it as random, systematic, or personal.

                    .. model-answer::
                        The error is a **zero error** *(1 mark)*, classified as a **systematic error** *(1 mark)*.

                    .. marking-guidance::
                        Accept "zero error" or "the balance has not been zeroed." Do not accept "human error" or "mistake".

            .. tab-item:: Part (b)

                .. subquestion:: Effect on measurements
                    :marks: 3

                    Explain how this error would affect the group's mass measurements. Refer to direction, accuracy, and precision.

                    .. model-answer::
                        - Every measurement is consistently **overestimated** by 0.4 g. *(1 mark)*
                        - **Accuracy** is reduced because recorded masses are 0.4 g higher than the true mass. *(1 mark)*
                        - **Precision** is unaffected because the same offset is present in every reading. *(1 mark)*

                    .. marking-guidance::
                        - **Direction:** Award only if overestimation is specified.
                        - **Precision:** Award only if stated as unaffected with valid reasoning.


.. structuredquestion:: Zero Error Investigation
    :total-marks: 8
    :category: Experimental Errors

    .. stimulus::
        A Year 8 class is investigating how the mass of a paper cup changes when different volumes of water are added to it. Before beginning, the teacher instructs students to place the empty cup on the balance and record the starting mass. One group notices their balance displays **0.4 g** before they place anything on it. They do not adjust the balance and proceed to record all their measurements.

    .. tab-set::

        .. tab-item:: Part (a)

            .. subquestion:: Identify the error
                :marks: 2

                Identify the type of error present in this investigation and classify it as random, systematic, or personal.

                .. model-answer::
                    The error is a **zero error** *(1 mark)*, classified as a **systematic error** *(1 mark)*.

                .. marking-guidance::
                    Accept "zero error" or "the balance has not been zeroed." Do not accept "human error" or "mistake".

        .. tab-item:: Part (b)

            .. subquestion:: Effect on measurements
                :marks: 3

                Explain how this error would affect the group's mass measurements. Refer to direction, accuracy, and precision.

                .. model-answer::
                    - Every measurement is consistently **overestimated** by 0.4 g. *(1 mark)*
                    - **Accuracy** is reduced because recorded masses are 0.4 g higher than the true mass. *(1 mark)*
                    - **Precision** is unaffected because the same offset is present in every reading. *(1 mark)*

                .. marking-guidance::
                    - **Direction:** Award only if overestimation is specified.
                    - **Precision:** Award only if stated as unaffected with valid reasoning.


----

Full length example
------------------------

.. structuredquestion:: Zero Error Investigation
    :total-marks: 8
    :category: Experimental Errors

    .. stimulus::
        A Year 8 class is investigating how the mass of a paper cup changes
        when different volumes of water are added to it. Before beginning,
        the teacher instructs students to place the empty cup on the balance
        and record the starting mass. One group notices their balance displays
        **0.4 g** before they place anything on it. They do not adjust the
        balance and proceed to record all their measurements.

    .. tab-set::

        .. tab-item:: Part (a)

            .. subquestion:: Identify the error
                :marks: 2

                Identify the type of error present in this investigation and
                classify it as random, systematic, or personal.

                .. model-answer::
                    The error is a **zero error**  *(1 mark)*, classified as a **systematic error**  *(1 mark)*.

                .. marking-guidance::
                    Accept "zero error" or "the balance has not been
                    zeroed." Do not accept "human error" or "mistake" — the balance
                    itself has a fault, so this is an instrumental error, not a
                    personal error.

        .. tab-item:: Part (b)

            .. subquestion:: Effect on measurements
                :marks: 3

                Explain how this error would affect the group's mass
                measurements. In your answer, refer to the direction of the error and
                its effect on the accuracy and precision of the results.

                .. model-answer::
                    - Every measurement is consistently **overestimated** by 0.4 g. *(1 mark)*
                    - **Accuracy** is reduced because recorded masses are 0.4 g higher than the true mass. *(1 mark)*
                    - **Precision** is unaffected because the same offset is present in every reading. *(1 mark)*

                .. marking-guidance::
                    - **Direction:** Award only if overestimation is specified.
                    - **Precision:** Award only if stated as unaffected with valid reasoning.

        .. tab-item:: Part (c)

            .. subquestion:: Repeating measurements
                :marks: 2

                The group repeats each measurement three times and calculates
                a mean. Evaluate whether this would reduce the effect of the error
                identified in part (a).

                .. model-answer::
                    - Repeating measurements would **not** reduce the effect of this error. *(1 mark)*
                    - Averaging does not cancel a consistent offset — it only reduces random errors. *(1 mark)*

                .. marking-guidance::
                    A response that simply states "repeating reduces error" without explaining why it does not apply here should not receive full marks.

        .. tab-item:: Part (d)

            .. subquestion:: Improvement
                :marks: 1

                Describe one improvement the group could make to eliminate
                this error before collecting data.

                .. model-answer::
                    Use the tare or zero function on the balance to set the display to 0.0 g before placing the cup on it. *(1 mark)*

                .. marking-guidance::
                    Accept "subtract 0.4 g from all readings as a correction factor".



