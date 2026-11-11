================================================
Graphing
================================================

The graphing directive creates a results table and a sheet of true-size graph paper for plotting a line graph. The student types in the independent variable (IV) and dependent variable (DV), their units, and the rows of results. Graph paper is then drawn with the axis scales marked in automatically for the range of values entered. The student plots the data points by clicking on the graph paper, and buttons check the points and draw in the correct points joined by a line.

Syntax
-------------------

.. code-block:: rst

    .. graphing::

All options and data are optional. With no data, the student fills in the table. With data, the table is set by the teacher.

.. code-block:: rst

    .. graphing::
        :iv: name of independent variable
        :iv-unit: unit
        :dv: name of dependent variable
        :dv-unit: unit

        IV value, DV value
        IV value, DV value
        IV value, DV value

Options for the graphing directive
--------------------------------------

.. list-table::
   :widths: 22 12 12 54
   :header-rows: 1

   * - Option
     - Type
     - Default
     - Description
   * - ``:title-form:``
     - choice
     - ``effect``
     - | Form of the graph title, which is written automatically from
       | the variable names and placed immediately above the graph.
       | ``effect`` gives "The effect of IV on DV".
       | ``vs`` gives "DV vs IV".
       | ``none`` gives no title.
   * - ``:title:``
     - string
     - None
     - | Your own graph title, used instead of the automatic one.
   * - ``:iv:``
     - string
     - None
     - | Name of the independent variable (horizontal axis).
       | If left out, the student types it in.
   * - ``:iv-unit:``
     - string
     - None
     - Unit of the independent variable, e.g. ``cm``.
   * - ``:dv:``
     - string
     - None
     - | Name of the dependent variable (vertical axis).
       | If left out, the student types it in.
   * - ``:dv-unit:``
     - string
     - None
     - Unit of the dependent variable, e.g. ``s``.
   * - ``:rows:``
     - 2 to 12
     - ``3``
     - | Number of rows in the results table. Students can add or
       | remove rows with the + Row and − Row buttons.
   * - ``:trials:``
     - 0 to 3
     - ``0``
     - | ``0`` (or ``averages``) gives one DV column for averages only.
       | ``1``, ``2`` or ``3`` gives that many trial columns plus an
       | Average column that is calculated automatically.
       | With teacher data, it is worked out from the number of values per line.
   * - ``:width:``
     - 4 to 25
     - ``12``
     - Width of the graph paper in cm.
   * - ``:height:``
     - 4 to 25
     - ``12``
     - Height of the graph paper in cm.
   * - ``:divisions:``
     - 1, 2, 4, 5, 10
     - ``5``
     - Number of small divisions per cm.
   * - ``:line:``
     - choice
     - ``points``
     - | ``points`` joins the points from point to point.
       | ``bestfit`` draws a straight line of best fit.
       | ``none`` draws no line.
   * - ``:zero:``
     - choice
     - ``both``
     - | Which axes start at 0: ``both``, ``x``, ``y`` or ``none``.
       | An axis that does not start at 0 starts just below the smallest value.
   * - ``:tolerance:``
     - number
     - ``0.5``
     - | How close a plotted point must be to be marked correct,
       | in small divisions.
   * - ``:average-dp:``
     - 0 to 6
     - auto
     - | Decimal places for the Average column. By default it matches
       | the most decimal places used in the trial values.
   * - ``:editable:``
     - flag
     - Off
     - | If present, students can change the teacher's variable
       | names, units and data.
   * - ``:show-coordinates:``
     - flag
     - Off
     - | If present, shows the coordinates under the pointer.
       | This is a support for students who are learning to read scales.
   * - ``:no-solution:``
     - flag
     - Off
     - If present, hides the "Show answer" button.
   * - ``:no-settings:``
     - flag
     - Off
     - If present, hides the "⚙ Graph settings" panel.


| **Results table**: Each row needs an IV value and at least one DV value. Empty rows are ignored. At least 2 rows are needed to draw a graph.
| **Trials and averages**: With ``:trials:`` 1 to 3, the Average column is calculated as the student types. The average is rounded and that rounded value is the one to be plotted.
| **Graph title**: The title is placed immediately above the graph and is built from the variable names, without units: "The effect of IV on DV" (default) or "DV vs IV" with ``:title-form: vs``. It updates as the variable names are typed. The first letter of a name is changed to lower case in the middle of the title; names such as pH are left as typed. Use ``:title:`` to set a title of your own.
| **Teacher data**: Put one row of results per line in the directive content: the IV value, then one value (averages only) or 2 to 3 trial values, separated by commas or spaces. The table is then locked and the graph paper is drawn straight away. Add ``:editable:`` to let students change it.
| **Graph paper**: The grid is drawn at its real size, so 12 cm on the screen setting prints as 12 cm on paper (print at 100% scale). Darker lines mark each cm.
| **Automatic scales**: Each cm is worth 1, 2 or 5 (times a power of ten), using the smallest value that fits all the data on the axis. This keeps the small divisions easy to read: with 5 divisions per cm each small division is worth 0.2, 0.4 or 1 (times a power of ten).
| **Plotting**: Click on the graph paper to plot a point (×). Drag a point to move it. Click a point to remove it. Points snap to the nearest half of a small division.
| **Check points**: Correct points turn green and incorrect points turn red.
| **Draw my line**: Joins the student's own points using the chosen line type.
| **Show answer**: Draws the correct points as blue circles and joins them with the chosen line. Checking and plotting are then switched off until "Start again" is pressed.
| **Graph settings**: The ⚙ Graph settings panel lets the size, divisions per cm, line type, graph title form and zero start of each axis be changed on the page.
| **Print**: The Print button prints just the table and graph. Points and lines on the graph are printed; buttons are not. Print before plotting to get blank graph paper for plotting by hand.


----

Example 1: Student enters all the data
------------------------------------------

| With no options, the student types in the variables, the units and three rows of values, then presses "Draw graph paper".

.. code-block:: rst

    .. graphing::

.. graphing::

----

Example 2: Teacher sets the data (averages only)
----------------------------------------------------

| Each line of data is an IV value then the DV value. The table is locked and the graph paper is drawn straight away. The title above the graph is written automatically in the default form, "The effect of IV on DV".

.. code-block:: rst

    .. graphing::
        :iv: Mass added
        :iv-unit: g
        :dv: Length of spring
        :dv-unit: cm
        :show-coordinates:

        50, 12.4
        100, 16.8
        150, 21.0

.. graphing::
    :iv: Mass added
    :iv-unit: g
    :dv: Length of spring
    :dv-unit: cm
    :show-coordinates:

    50, 12.4
    100, 16.8
    150, 21.0

----

Example 3: Teacher sets three trials
----------------------------------------------------

| With more than one DV value per line, trial columns are shown and the average is calculated automatically. The averages are plotted.

.. code-block:: rst

    .. graphing::
        :iv: Length of pendulum
        :iv-unit: cm
        :dv: Time for 10 swings
        :dv-unit: s

        20, 9.1, 8.9, 9.0
        40, 12.6, 12.8, 12.7
        60, 15.4, 15.6, 15.5

.. graphing::
    :iv: Length of pendulum
    :iv-unit: cm
    :dv: Time for 10 swings
    :dv-unit: s

    20, 9.1, 8.9, 9.0
    40, 12.6, 12.8, 12.7
    60, 15.4, 15.6, 15.5

----

Example 4: Student enters trials
----------------------------------------------------

| The variables are set by the teacher and the student enters three trials for each of five rows.

.. code-block:: rst

    .. graphing::
        :iv: Drop height
        :iv-unit: cm
        :dv: Bounce height
        :dv-unit: cm
        :trials: 3
        :rows: 5

.. graphing::
    :iv: Drop height
    :iv-unit: cm
    :dv: Bounce height
    :dv-unit: cm
    :trials: 3
    :rows: 5

----

Example 5: Line of best fit and "DV vs IV" title
----------------------------------------------------

| ``:line: bestfit`` draws a straight line of best fit instead of joining the points. ``:title-form: vs`` writes the graph title as "DV vs IV".

.. code-block:: rst

    .. graphing::
        :iv: Time
        :iv-unit: min
        :dv: Temperature
        :dv-unit: °C
        :line: bestfit
        :title-form: vs

        0, 21
        2, 34
        4, 44
        6, 58
        8, 67

.. graphing::
    :iv: Time
    :iv-unit: min
    :dv: Temperature
    :dv-unit: °C
    :line: bestfit
    :title-form: vs

    0, 21
    2, 34
    4, 44
    6, 58
    8, 67

----

Example 6: Size, divisions and axis start
----------------------------------------------------

| A 10 cm wide by 8 cm high grid with 10 divisions per cm (mm graph paper). ``:zero: x`` starts only the horizontal axis at 0, so the vertical axis starts just below the smallest value. ``:title:`` sets a title of your own.

.. code-block:: rst

    .. graphing::
        :title: Cooling curve
        :iv: Time
        :iv-unit: min
        :dv: Temperature
        :dv-unit: °C
        :width: 10
        :height: 8
        :divisions: 10
        :zero: x

        0, 82
        5, 71
        10, 63
        15, 58

.. graphing::
    :title: Cooling curve
    :iv: Time
    :iv-unit: min
    :dv: Temperature
    :dv-unit: °C
    :width: 10
    :height: 8
    :divisions: 10
    :zero: x

    0, 82
    5, 71
    10, 63
    15, 58

----

Example 7: Support options
----------------------------------------------------

| ``:show-coordinates:`` shows the coordinates under the pointer, ``:tolerance: 1`` accepts points within one small division, and ``:editable:`` lets students change the teacher's data.

.. code-block:: rst

    .. graphing::
        :iv: Number of coils
        :dv: Paper clips lifted
        :show-coordinates:
        :tolerance: 1
        :editable:

        10, 3
        20, 7
        30, 12

.. graphing::
    :iv: Number of coils
    :dv: Paper clips lifted
    :show-coordinates:
    :tolerance: 1
    :editable:

    10, 3
    20, 7
    30, 12
