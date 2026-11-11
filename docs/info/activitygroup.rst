================================================
Activity Group
================================================

| The activitygroup directive groups one activity with questions about it.
| The first directive inside the group is the activity (for example ``.. graphing::``). Every directive after it is a question about the activity (for example ``.. gapfill::`` or ``.. multichoice::``).
| The activity and its questions are shown in one block, print together, and the questions can be kept locked until the activity is finished.

----

Syntax
-------------------

.. code-block:: rst

    .. activitygroup::
        :reveal: check

        .. graphing::
            :iv: Length of pendulum
            :iv-unit: cm
            :dv: Time for 10 swings
            :dv-unit: s

            20, 9.0
            40, 12.7
            60, 15.5

        .. gapfill::

            As the length of the pendulum increases, the time for 10 swings @@increases | decreases | stays the same@@.

----

Options for the activitygroup directive
------------------------------------------

.. list-table::
   :widths: 24 10 14 52
   :header-rows: 1

   * - Option
     - Type
     - Default
     - Description
   * - ``:title:``
     - string
     - None
     - Heading shown at the top of the group.
   * - ``:reveal:``
     - choice
     - ``always``
     - | When the questions are shown.
       | ``always`` shows them from the start.
       | ``check`` unlocks them when the activity is checked and is all correct.
       | ``answer`` unlocks them when the activity is all correct or its answer is shown.
   * - ``:questions-title:``
     - string
     - ``Questions``
     - Heading above the questions.
   * - ``:locked-message:``
     - string
     - See below
     - | Message shown while the questions are locked.
       | Default for ``check``: "Complete the activity above and check that it is correct to unlock the questions."
   * - ``:no-print:``
     - flag
     - Off
     - If present, hides the "Print activity and questions" button.


| **Activity and questions**: The first directive in the group is the activity. Any text before it is shown with the activity. Everything after the first directive is a question, and plain text can be used between questions.
| **Locking**: With ``:reveal: check`` or ``:reveal: answer`` the questions stay hidden until the activity is finished. Once unlocked they stay unlocked until the page is reloaded.
| **Activities that can unlock questions**: ``graphing``, ``imagesequence`` and ``foodweb`` (in its Place mode) report when they are finished. Any other directive can still be used as the activity, but its questions are shown from the start. See :doc:`food chains with questions <../food_webs/stringybark_food_chain_questions>` and :doc:`a food web with questions <../food_webs/stringybark_food_web_questions>` for examples.
| **Questions**: Each question keeps its own Check and Reset buttons and works the same as it does outside the group.
| **Print**: The "Print activity and questions" button prints just this group. Buttons are not printed, and locked questions are printed, so a blank sheet can be printed for students to complete by hand.

----

Example 1: Questions shown from the start
------------------------------------------------

| With no options, the graph and its questions are shown together.

.. code-block:: rst

    .. activitygroup::
        :title: Stretching a spring

        .. graphing::
            :iv: Mass added
            :iv-unit: g
            :dv: Length of spring
            :dv-unit: cm

            50, 12.4
            100, 16.8
            150, 21.0

        .. gapfill::
            :instructions: Write the trend shown by the graph.

            As the mass added increases, the length of the spring @@increases | decreases | stays the same@@.

        .. multichoice::

            What is the length of the spring when 100 g is added?

            [x] 16.8 cm | Correct.
            [ ] 12.4 cm | Incorrect. That is the length for 50 g.
            [ ] 21.0 cm | Incorrect. That is the length for 150 g.

.. activitygroup::
    :title: Stretching a spring

    .. graphing::
        :iv: Mass added
        :iv-unit: g
        :dv: Length of spring
        :dv-unit: cm

        50, 12.4
        100, 16.8
        150, 21.0

    .. gapfill::
        :instructions: Write the trend shown by the graph.

        As the mass added increases, the length of the spring @@increases | decreases | stays the same@@.

    .. multichoice::

        What is the length of the spring when 100 g is added?

        [x] 16.8 cm | Correct.
        [ ] 12.4 cm | Incorrect. That is the length for 50 g.
        [ ] 21.0 cm | Incorrect. That is the length for 150 g.

----

Example 2: Questions unlock when the graph is correct
---------------------------------------------------------

| ``:reveal: check`` keeps the questions locked until all the points are plotted correctly and "Check points" is pressed. Showing the answer does not unlock them.

.. code-block:: rst

    .. activitygroup::
        :title: Pendulum
        :reveal: check

        Plot the average time for each length.

        .. graphing::
            :iv: Length of pendulum
            :iv-unit: cm
            :dv: Time for 10 swings
            :dv-unit: s

            20, 9.1, 8.9, 9.0
            40, 12.6, 12.8, 12.7
            60, 15.4, 15.6, 15.5

        .. gapfill::
            :instructions: Write the trend shown by the graph.

            As the @@length of the pendulum | time for 10 swings@@ increases, the @@time for 10 swings | length of the pendulum@@ @@increases | decreases | stays the same@@.

.. activitygroup::
    :title: Pendulum
    :reveal: check

    Plot the average time for each length.

    .. graphing::
        :iv: Length of pendulum
        :iv-unit: cm
        :dv: Time for 10 swings
        :dv-unit: s

        20, 9.1, 8.9, 9.0
        40, 12.6, 12.8, 12.7
        60, 15.4, 15.6, 15.5

    .. gapfill::
        :instructions: Write the trend shown by the graph.

        As the @@length of the pendulum | time for 10 swings@@ increases, the @@time for 10 swings | length of the pendulum@@ @@increases | decreases | stays the same@@.

----

Example 3: Questions unlock when the answer is shown
---------------------------------------------------------

| ``:reveal: answer`` also unlocks the questions when "Show answer" is pressed, so a student who cannot plot the graph can still go on. ``:locked-message:`` and ``:questions-title:`` change the wording.

.. code-block:: rst

    .. activitygroup::
        :reveal: answer
        :questions-title: Analysis
        :locked-message: Plot the graph first. The analysis questions will then appear here.

        .. graphing::
            :iv: Time
            :iv-unit: min
            :dv: Temperature
            :dv-unit: °C
            :line: bestfit

            0, 21
            2, 34
            4, 44
            6, 58
            8, 67

        .. multichoice::

            What happens to the temperature as time increases?

            [x] It increases | Correct.
            [ ] It decreases | Incorrect. The line goes up.
            [ ] It stays the same | Incorrect. The line goes up.

.. activitygroup::
    :reveal: answer
    :questions-title: Analysis
    :locked-message: Plot the graph first. The analysis questions will then appear here.

    .. graphing::
        :iv: Time
        :iv-unit: min
        :dv: Temperature
        :dv-unit: °C
        :line: bestfit

        0, 21
        2, 34
        4, 44
        6, 58
        8, 67

    .. multichoice::

        What happens to the temperature as time increases?

        [x] It increases | Correct.
        [ ] It decreases | Incorrect. The line goes up.
        [ ] It stays the same | Incorrect. The line goes up.
