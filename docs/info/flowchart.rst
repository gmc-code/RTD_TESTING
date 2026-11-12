================================================
Flowchart
================================================

The flowchart directive draws a flowchart from pseudocode. The pseudocode is shown beside the chart, and pointing at a line lights up its shape (and pointing at a shape lights up its line). Students can step through the algorithm one shape at a time, typing in the inputs and watching the variables and output change. In blanks mode the text in the shapes is hidden, and students drag or type it back in. In draw mode students build the whole flowchart themselves from a palette of shapes, and it is checked against the pseudocode.

Syntax
-------------------

.. code-block:: rst

    .. flowchart::

        BEGIN
            pseudocode
        END

All options are optional. The content is the pseudocode.

.. code-block:: rst

    .. flowchart::
        :mode: step, view, blanks or draw
        :title: title above the chart
        :inputs: values for the input boxes
        :blank: which shapes to empty
        :entry: drag or type

        BEGIN
            pseudocode
        END

Options for the flowchart directive
--------------------------------------

.. list-table::
   :widths: 22 14 12 52
   :header-rows: 1

   * - Option
     - Type
     - Default
     - Description
   * - ``:mode:``
     - choice
     - ``step``
     - | ``step`` adds Step, Run and Reset buttons, a variable table and an output panel.
       | ``view`` gives the chart and pseudocode only, with line to shape linking.
       | ``blanks`` hides the text in the shapes for students to fill in.
       | ``draw`` gives a drawing area and a palette of shapes. The pseudocode
       | is the answer and is hidden until the flowchart is correct.
       | ``step`` changes to ``view`` by itself if a line cannot be run.
   * - ``:title:``
     - string
     - None
     - Title shown above the chart.
   * - ``:inputs:``
     - list
     - None
     - | Comma separated values placed in the input boxes, in order.
       | Students can change them before pressing Enter.
   * - ``:blank:``
     - list
     - ``all``
     - | Blanks mode: which shapes are emptied.
       | ``all`` empties every shape except Start and End.
       | ``decisions``, ``io`` and ``process`` empty that kind of shape.
       | Numbers empty the shapes for those pseudocode lines.
       | They can be combined, e.g. ``decisions, 4``.
   * - ``:entry:``
     - choice
     - ``drag``
     - | Blanks and draw modes: ``drag`` gives a bank of labels to drag onto
       | the shapes (or tap a label, then tap a shape).
       | ``type`` has students type the text.
   * - ``:answers:``
     - flag
     - off
     - Blanks and draw modes: adds a Show answers button.
   * - ``:show-code:``
     - flag
     - off
     - | Draw mode: shows the pseudocode beside the drawing area,
       | for turning pseudocode into a flowchart.
   * - ``:height:``
     - pixels
     - auto
     - | Draw mode: height of the drawing area.
       | By default it is sized to fit the answer with room to spare.
   * - ``:layout:``
     - choice
     - ``auto``
     - | ``side`` puts the pseudocode beside the chart.
       | ``stacked`` puts the pseudocode above the chart.
       | ``auto`` chooses ``stacked`` for wide charts.
   * - ``:hide-code:``
     - flag
     - off
     - Hides the pseudocode panel.
   * - ``:class:``
     - string
     - None
     - Extra CSS class for the container.

Pseudocode that is understood
--------------------------------------

Keywords are in UPPERCASE. Indentation is for the reader; blocks are found from the keywords.

.. list-table::
   :widths: 40 60
   :header-rows: 1

   * - Pseudocode
     - Shape
   * - ``BEGIN`` or ``START``, ``END`` or ``STOP``
     - Terminator (rounded) for Start and End.
   * - ``INPUT a, b`` or ``GET a``
     - Parallelogram. Asks for a value for each variable.
   * - ``name ← INPUT "prompt"``
     - Parallelogram. Shows the prompt and asks for a value.
   * - ``PRINT``, ``OUTPUT`` or ``DISPLAY``
     - Parallelogram. Adds a line to the output panel.
   * - ``A ← l * w``
     - Rectangle. "Calculate" if there is working out, otherwise "Set".
   * - ``IF … THEN``, ``ELSEIF … THEN``, ``ELSE``, ``ENDIF``
     - Diamond for each condition, with Yes and No branches.
   * - ``CASE … OF``, ``OTHERWISE:``, ``ENDCASE``
     - Diamond for each case.
   * - ``WHILE …``, ``ENDWHILE``
     - Diamond tested before the loop body.
   * - ``FOR i ← 0 TO 3``, ``NEXT i``
     - Set, diamond and Calculate shapes for the counter.
   * - ``REPEAT``, ``UNTIL …``
     - Diamond tested after the loop body.
   * - ``DO``, ``WHILE …``
     - Diamond tested after the loop body.
   * - Anything else
     - Rectangle with the text as written. The chart cannot be stepped through.

| Operators: ``+ - * / ^ MOD DIV``, ``= ≠ < > <= >=``, ``AND OR NOT``, ``TRUE FALSE``.
| ``+`` joins text if either side is text.
| Functions: ``str int float abs sqrt round len upper lower max min``.
| ``A = 5`` at the start of a line is treated as assignment, with a build warning to use ``←``.

Shape text
~~~~~~~~~~~~~~~~

| Add ``// text`` to the end of a line to set the text in its shape.
| The comment is not shown in the pseudocode panel.

.. code-block:: rst

    A ← l * w      // Calculate A = l x w

Draw mode
~~~~~~~~~~~~~~~~

| **Shapes:** click a shape in the palette to add it, or drag it onto the drawing area. Drag a shape to move it.
| **Text:** drag a label onto a shape, or tap the label and then the shape. Double-click a shape to send its label back. With ``:entry: type``, double-click a shape to type its text.
| **Arrows:** point at a shape to see its four dots, then drag from a dot to another shape.
| **Lines with corners:** click a dot (without dragging), click where the line should turn, as many times as needed, then click a shape or another line to finish. Press Esc, or click the starting shape, to cancel.
| **Joining a line:** an arrow can end on another line as well as on a shape. Drop it on the line, or click the line to finish. This is how to draw the line that repeats a loop: take it from the decision back up to the line above the first shape in the loop. To join two paths, either end both arrows on the same shape or end one on the other's line.
| **Yes and No:** an arrow leaving a decision has a label. Click the label to switch between Yes and No.
| **Delete:** click a shape or an arrow, then press **Delete**.
| **Check:** gives hints about missing shapes, text in the wrong kind of shape, and arrows that go to the wrong place.
| When the flowchart is correct, the pseudocode is shown and the Step buttons run the student's own flowchart.

| The drawing is checked against the structure of the pseudocode: the same shapes, joined in the same order, with the same Yes and No branches.
| A flowchart that works but tests the conditions in a different order is marked as not matching.
| Where the shapes are placed on the drawing area does not matter.

Saved work
~~~~~~~~~~~~~~~~

| In draw and blanks modes, a student's work is saved in their browser as they go, so refreshing the page or coming back later does not lose it.
| **Start again** clears the saved work.
| The work is saved on that device and browser only. It is not saved in a private window, and it is cleared if the browser's site data is cleared.
| Changing the pseudocode or the mode, blank or entry options starts everyone afresh.

Printing
~~~~~~~~~~~~~~~~

| The buttons, variable table and output panel are left out of the print.
| In blanks mode the chart prints with empty shapes and the labels listed underneath.
| In draw mode the drawing area prints as it is, so an empty one can be drawn on by hand.

----

Example 1: Step through
-----------------------------------

| Press **Step** to move to the next shape. Type a value when the algorithm asks for input.
| **Run** steps automatically and **Reset** starts again.

.. code-block:: rst

    .. flowchart::
        :title: Positive or not?

        ALGORITHM positiveOrNot()

        BEGIN
            INPUT number
            IF number > 0 THEN
                PRINT number + " is positive."
            ELSE
                PRINT number + " is not positive."
            ENDIF
        END

.. flowchart::
    :title: Positive or not?

    ALGORITHM positiveOrNot()

    BEGIN
        INPUT number
        IF number > 0 THEN
            PRINT number + " is positive."
        ELSE
            PRINT number + " is not positive."
        ENDIF
    END

----

Example 2: Inputs and shape text
--------------------------------------------

| ``:inputs:`` puts starting values in the input boxes.
| ``// text`` sets the text in the process shape.

.. code-block:: rst

    .. flowchart::
        :title: Area of a rectangle
        :inputs: 5, 3

        ALGORITHM rectangleArea()

        BEGIN
            INPUT l, w
            A  ←  l * w      // Calculate A = l x w
            PRINT A
        END

.. flowchart::
    :title: Area of a rectangle
    :inputs: 5, 3

    ALGORITHM rectangleArea()

    BEGIN
        INPUT l, w
        A  ←  l * w      // Calculate A = l x w
        PRINT A
    END

----

Example 3: ELSEIF
-----------------------------

| Each ``ELSEIF`` adds a diamond to the right, joined by the No branch.

.. code-block:: rst

    .. flowchart::
        :title: Triangles by sides

        BEGIN
            INPUT sideA, sideB, sideC
            IF sideA = sideB AND sideB = sideC THEN
                PRINT "Equilateral triangle."
            ELSEIF sideA = sideB OR sideB = sideC OR sideA = sideC THEN
                PRINT "Isosceles triangle."
            ELSE
                PRINT "Scalene triangle."
            ENDIF
        END

.. flowchart::
    :title: Triangles by sides

    BEGIN
        INPUT sideA, sideB, sideC
        IF sideA = sideB AND sideB = sideC THEN
            PRINT "Equilateral triangle."
        ELSEIF sideA = sideB OR sideB = sideC OR sideA = sideC THEN
            PRINT "Isosceles triangle."
        ELSE
            PRINT "Scalene triangle."
        ENDIF
    END

----

Example 4: WHILE loop
---------------------------------

| The condition is tested before the loop body.

.. code-block:: rst

    .. flowchart::

        BEGIN
            num ← 1
            WHILE num < 10
                PRINT num
                num ← num + 2
            ENDWHILE
        END

.. flowchart::

    BEGIN
        num ← 1
        WHILE num < 10
            PRINT num
            num ← num + 2
        ENDWHILE
    END

----

Example 5: FOR loop
-------------------------------

| The counter is set, tested and increased in separate shapes.

.. code-block:: rst

    .. flowchart::

        BEGIN
            FOR i ← 0 TO 3
                PRINT i
            NEXT i
        END

.. flowchart::

    BEGIN
        FOR i ← 0 TO 3
            PRINT i
        NEXT i
    END

----

Example 6: REPEAT UNTIL loop
----------------------------------------

| The condition is tested after the loop body.

.. code-block:: rst

    .. flowchart::

        BEGIN
            num ← 1
            REPEAT
                PRINT num
                num ← num + 2
            UNTIL num > 9
        END

.. flowchart::

    BEGIN
        num ← 1
        REPEAT
            PRINT num
            num ← num + 2
        UNTIL num > 9
    END

----

Example 7: CASE
---------------------------

| Each case becomes a diamond.

.. code-block:: rst

    .. flowchart::
        :inputs: B+

        BEGIN
            INPUT grade
            CASE grade OF
                "A+", "A", "B+", "B", "C+", "C":
                    PRINT "Acceptable standard."
                "D+", "D", "NP", "UG":
                    PRINT "Retest required."
                OTHERWISE:
                    PRINT "Not a valid grade"
            ENDCASE
        END

.. flowchart::
    :inputs: B+

    BEGIN
        INPUT grade
        CASE grade OF
            "A+", "A", "B+", "B", "C+", "C":
                PRINT "Acceptable standard."
            "D+", "D", "NP", "UG":
                PRINT "Retest required."
            OTHERWISE:
                PRINT "Not a valid grade"
        ENDCASE
    END

----

Example 8: Fill in the blanks
-----------------------------------------

| ``:mode: blanks`` empties every shape except Start and End.
| Drag each label onto its shape, then press **Check**.
| ``:answers:`` adds a Show answers button.
| When every shape is correct, the Step buttons appear.

.. code-block:: rst

    .. flowchart::
        :mode: blanks
        :answers:

        BEGIN
            INPUT number
            IF number > 0 THEN
                PRINT number + " is positive."
            ELSE
                PRINT number + " is not positive."
            ENDIF
        END

.. flowchart::
    :mode: blanks
    :answers:

    BEGIN
        INPUT number
        IF number > 0 THEN
            PRINT number + " is positive."
        ELSE
            PRINT number + " is not positive."
        ENDIF
    END

----

Example 9: Blank the decisions only
-----------------------------------------------

| ``:blank: decisions`` empties just the diamonds.

.. code-block:: rst

    .. flowchart::
        :mode: blanks
        :blank: decisions
        :title: Triangles by angles

        BEGIN
            INPUT angleA, angleB, angleC
            IF angleA + angleB + angleC ≠ 180 THEN
                PRINT "Not a valid triangle."
            ELSEIF angleA < 90 AND angleB < 90 AND angleC < 90 THEN
                PRINT "Acute triangle."
            ELSEIF angleA = 90 OR angleB = 90 OR angleC = 90 THEN
                PRINT "Right triangle."
            ELSE
                PRINT "Obtuse triangle."
            ENDIF
        END

.. flowchart::
    :mode: blanks
    :blank: decisions
    :title: Triangles by angles

    BEGIN
        INPUT angleA, angleB, angleC
        IF angleA + angleB + angleC ≠ 180 THEN
            PRINT "Not a valid triangle."
        ELSEIF angleA < 90 AND angleB < 90 AND angleC < 90 THEN
            PRINT "Acute triangle."
        ELSEIF angleA = 90 OR angleB = 90 OR angleC = 90 THEN
            PRINT "Right triangle."
        ELSE
            PRINT "Obtuse triangle."
        ENDIF
    END

----

Example 10: Type the missing text
---------------------------------------------

| ``:entry: type`` has students click a shape and type its text.
| ``:blank: 3`` empties the shape for line 3 of the pseudocode.
| Capital letters and spaces are ignored when checking, and ``A = l * l`` is accepted for a Calculate shape.

.. code-block:: rst

    .. flowchart::
        :mode: blanks
        :entry: type
        :blank: 3

        BEGIN
            INPUT l
            A ← l * l
            OUTPUT A
        END

.. flowchart::
    :mode: blanks
    :entry: type
    :blank: 3

    BEGIN
        INPUT l
        A ← l * l
        OUTPUT A
    END

----

Example 11: Draw it yourself
----------------------------------------

| ``:mode: draw`` hides the pseudocode and gives a palette of shapes and a bank of labels.
| Draw the flowchart for this task: *input a number, then print whether it is positive or not*.

.. code-block:: rst

    .. flowchart::
        :mode: draw
        :answers:

        BEGIN
            INPUT number
            IF number > 0 THEN
                PRINT number + " is positive."
            ELSE
                PRINT number + " is not positive."
            ENDIF
        END

.. flowchart::
    :mode: draw
    :answers:

    BEGIN
        INPUT number
        IF number > 0 THEN
            PRINT number + " is positive."
        ELSE
            PRINT number + " is not positive."
        ENDIF
    END

----

Example 12: Draw from pseudocode, typing the text
-------------------------------------------------------------

| ``:show-code:`` shows the pseudocode to turn into a flowchart.
| ``:entry: type`` has students type the text in each shape.

.. code-block:: rst

    .. flowchart::
        :mode: draw
        :show-code:
        :entry: type

        BEGIN
            INPUT l
            A ← l * l
            OUTPUT A
        END

.. flowchart::
    :mode: draw
    :show-code:
    :entry: type

    BEGIN
        INPUT l
        A ← l * l
        OUTPUT A
    END

----

Example 13: Draw a nested decision
----------------------------------------------

| A challenge task: *output a square, a rhombus or a rectangle from the inputs hasAllRightAngles and hasAllSidesEqual*. Since there is more than one way ot od this, make sure to check for right angles first, then check for equal sides.

.. code-block:: rst

    .. flowchart::
        :mode: draw
        :title: Classify rhombus, square, rectangle

        BEGIN
            INPUT hasAllRightAngles, hasAllSidesEqual
            IF hasAllRightAngles = TRUE THEN
                IF hasAllSidesEqual = TRUE THEN
                    PRINT "square"
                ELSE
                    PRINT "rectangle"
                ENDIF
            ELSE
                PRINT "rhombus"
            ENDIF
        END

.. flowchart::
    :mode: draw
    :title: Classify rhombus, square, rectangle

    BEGIN
        INPUT hasAllRightAngles, hasAllSidesEqual
        IF hasAllRightAngles = TRUE THEN
            IF hasAllSidesEqual = TRUE THEN
                PRINT "square"
            ELSE
                PRINT "rectangle"
            ENDIF
        ELSE
            PRINT "rhombus"
        ENDIF
    END

----

Example 14: View only
---------------------------------

| Pseudocode written in plain English cannot be run, so it is drawn without the Step buttons.

.. code-block:: rst

    .. flowchart::

        BEGIN
            INPUT a number between 1 and 10
            Multiply by 3
            Add 18
            Multiply by 3
            PRINT all the digits but 1
        END

.. flowchart::

    BEGIN
        INPUT a number between 1 and 10
        Multiply by 3
        Add 18
        Multiply by 3
        PRINT all the digits but 1
    END

----

Example 15: REPEAT loop: ask until the input is valid
-----------------------------------------------------------------

| A ``REPEAT`` loop always runs its body at least once, so it suits asking for input until it is acceptable.
| The No branch of the ``UNTIL`` decision goes back to the top of the loop.
| ``:inputs:`` gives two rejected values and then an accepted one.

.. code-block:: rst

    .. flowchart::
        :title: Ask for a positive number
        :inputs: -3, 0, 5

        BEGIN
            REPEAT
                INPUT number
            UNTIL number > 0
            PRINT number + " is positive."
        END

.. flowchart::
    :title: Ask for a positive number
    :inputs: -3, 0, 5

    BEGIN
        REPEAT
            INPUT number
        UNTIL number > 0
        PRINT number + " is positive."
    END

----

Example 16: REPEAT loop: running total
--------------------------------------------------

| The loop keeps adding scores until the total reaches 20.
| Watch ``total`` change in the variable table on each pass.

.. code-block:: rst

    .. flowchart::
        :title: Add scores until the total reaches 20
        :inputs: 8, 7, 9

        BEGIN
            total ← 0
            REPEAT
                INPUT score
                total ← total + score
            UNTIL total >= 20
            PRINT "Total is " + total
        END

.. flowchart::
    :title: Add scores until the total reaches 20
    :inputs: 8, 7, 9

    BEGIN
        total ← 0
        REPEAT
            INPUT score
            total ← total + score
        UNTIL total >= 20
        PRINT "Total is " + total
    END

----

Example 17: REPEAT loop with a decision inside
----------------------------------------------------------

| An ``IF`` inside the loop body is drawn inside the loop.

.. code-block:: rst

    .. flowchart::
        :title: Odd or even, from 1 to 4

        BEGIN
            count ← 1
            REPEAT
                IF count MOD 2 = 0 THEN
                    PRINT count + " is even"
                ELSE
                    PRINT count + " is odd"
                ENDIF
                count ← count + 1
            UNTIL count > 4
        END

.. flowchart::
    :title: Odd or even, from 1 to 4

    BEGIN
        count ← 1
        REPEAT
            IF count MOD 2 = 0 THEN
                PRINT count + " is even"
            ELSE
                PRINT count + " is odd"
            ENDIF
            count ← count + 1
        UNTIL count > 4
    END

----

Example 18: DO WHILE loop
-------------------------------------

| ``DO`` … ``WHILE`` also tests after the loop body, but it repeats while the condition is true.
| Here the Yes branch goes back to the top of the loop. Compare it with ``REPEAT`` … ``UNTIL``, where the No branch goes back.

.. code-block:: rst

    .. flowchart::
        :title: Count down in threes

        BEGIN
            num ← 10
            DO
                PRINT num
                num ← num - 3
            WHILE num > 0
        END

.. flowchart::
    :title: Count down in threes

    BEGIN
        num ← 10
        DO
            PRINT num
            num ← num - 3
        WHILE num > 0
    END

----

Example 19: REPEAT loop: fill in the blanks
-------------------------------------------------------

| ``:mode: blanks`` with a repeat loop.

.. code-block:: rst

    .. flowchart::
        :mode: blanks
        :answers:
        :title: Guess the number

        BEGIN
            secret ← 7
            REPEAT
                INPUT guess
            UNTIL guess = secret
            PRINT "Correct!"
        END

.. flowchart::
    :mode: blanks
    :answers:
    :title: Guess the number

    BEGIN
        secret ← 7
        REPEAT
            INPUT guess
        UNTIL guess = secret
        PRINT "Correct!"
    END

----

Example 20: REPEAT loop: draw it yourself
-----------------------------------------------------

| Draw the flowchart for this task: *count down from 3 to 1, then print Lift off!*
| For the line that repeats the loop, click the dot on the left of the decision, click to the left, click level with the gap above the first shape in the loop, then click the line there.
| The line can also end on the first shape in the loop.

.. code-block:: rst

    .. flowchart::
        :mode: draw
        :answers:
        :title: Countdown

        BEGIN
            count ← 3
            REPEAT
                PRINT count
                count ← count - 1
            UNTIL count = 0
            PRINT "Lift off!"
        END

.. flowchart::
    :mode: draw
    :answers:
    :title: Countdown

    BEGIN
        count ← 3
        REPEAT
            PRINT count
            count ← count - 1
        UNTIL count = 0
        PRINT "Lift off!"
    END
