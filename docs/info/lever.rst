================================================
Lever
================================================

The lever directive draws a lever that can be balanced using weights (downward forces) and upward forces. It covers all three classes of lever. The teacher sets some of the forces and marks the size or position of others with ``?`` for the student to work out. The lever tips or balances according to the turning effect of each force (force × distance from the fulcrum).

Syntax
-------------------

.. code-block:: rst

    .. lever::

With no class and no forces, the student can swap between the three classes of lever and explore each one.

.. code-block:: rst

    .. lever:: lever class (1, 2 or 3)
        :distance-unit: unit

        load size at distance left
        effort ? at distance right

Each line of content is one force:

.. code-block:: rst

    kind size at distance side "label"

.. list-table::
   :widths: 18 82
   :header-rows: 1

   * - Part
     - Description
   * - ``kind``
     - | ``load`` is a weight labelled Load (red).
       | ``effort`` is labelled Effort (blue). It pushes down on a class 1 lever
       | and pulls up on class 2 and class 3 levers. Add ``up`` or ``down``
       | after the size to change this, e.g. ``effort 4 up at 3 left``.
       | ``weight`` is a plain weight hanging from the beam (grey).
       | ``up`` is a plain upward force (green).
   * - ``size``
     - | A number is a fixed size, e.g. ``6``.
       | ``?`` is a size for the student to work out.
       | A number followed by ``?`` can be changed by the student, e.g. ``6?``.
   * - ``distance``
     - | Distance from the fulcrum. A number is a fixed position, e.g. ``4``.
       | ``?`` is a position for the student to work out.
       | A number followed by ``?`` can be moved by the student, e.g. ``4?``.
   * - ``side``
     - | ``left`` or ``right`` of the fulcrum. If left out, ``right`` is used
       | where there is beam to the right of the fulcrum.
       | With a ``?`` distance, the side keeps the force on that side;
       | if left out, the student can move it to either side.
   * - ``"label"``
     - | Optional name in quotes to use instead of Load, Effort,
       | Weight or Upward force, e.g. ``"Soil"``.

Unit words can be written after the numbers to make the lines easier to read, e.g. ``load 60 N at 20 cm left``. They are ignored; the units shown come from the options.

Options for the lever directive
--------------------------------------

.. list-table::
   :widths: 22 14 12 52
   :header-rows: 1

   * - Option
     - Type
     - Default
     - Description
   * - lever class
     - 1, 2 or 3
     - None
     - | Written after the directive, e.g. ``.. lever:: 2``.
       | Class 1 has the fulcrum in the centre and the effort pushing down.
       | Class 2 and 3 have the fulcrum at the left end and the effort pulling up.
   * - ``:title:``
     - string
     - None
     - Title shown above the lever.
   * - ``:divisions:``
     - 4 to 16
     - ``10``
     - Number of divisions along the whole beam.
   * - ``:fulcrum:``
     - choice or number
     - by class
     - | ``centre``, ``left`` or ``right``, or the number of divisions
       | from the left end, e.g. ``2`` for a fulcrum close to the left end.
   * - ``:spacing:``
     - number
     - ``1``
     - | Distance between marks, e.g. ``10`` numbers the marks
       | 10, 20, 30 from the fulcrum.
   * - ``:distance-unit:``
     - string
     - None
     - Unit for distances, e.g. ``cm``.
   * - ``:force-unit:``
     - string
     - ``N``
     - Unit for forces.
   * - ``:max-force:``
     - number
     - ``20``
     - Largest size a student can give a force.
   * - ``:step:``
     - number
     - ``1``
     - | Step for sizes, e.g. ``0.5`` or ``5``. "Show answer" only uses
       | sizes that are a whole number of steps.
   * - ``:hold:``
     - flag
     - Off
     - | If present, supports hold the lever level until
       | "Release lever" is pressed, so students calculate first
       | and then test their answer.
   * - ``:show-moments:``
     - flag
     - Off
     - | If present, shows a table of the turning effect of each force
       | with the clockwise and anticlockwise totals.
   * - ``:allow-add:``
     - flag
     - Off
     - | If present, students can add their own weights and upward
       | forces to the forces that have been set.
   * - ``:no-class-label:``
     - flag
     - Off
     - | If present, hides the line that names the class of lever,
       | so students can be asked to identify it.
   * - ``:no-solution:``
     - flag
     - Off
     - If present, hides the "Show answer" button.


| **Turning effects**: The turning effect (moment) of a force is its size × its distance from the fulcrum. The lever balances when the total clockwise turning effect equals the total anticlockwise turning effect. The beam itself is treated as having no weight.
| **Classes of lever**: With one ``load`` and one ``effort``, the class is named above the lever from where they are: class 1 has the fulcrum between them, class 2 has the load between the fulcrum and the effort, and class 3 has the effort between the fulcrum and the load. The name updates if the student moves them.
| **Changing forces**: Forces that can be changed have an orange outline. Sizes are typed into the boxes under the lever. A force with a ``?`` distance is dragged along the beam, or its distance is chosen from the list. Forces snap to the marks, and two weights (or two upward forces) cannot share a mark.
| **Unknown sizes**: A ``?`` size is drawn dashed and labelled "? N" until the student gives it a size.
| **Check**: Says whether the lever is balanced and, if not, which way it turns.
| **Release lever**: With ``:hold:``, this button replaces Check. The supports are taken away and the lever balances or tips. Changing a force puts the supports back.
| **Show answer**: Balances the lever by changing one of the student's forces. Changes are then switched off until "Start again" is pressed.
| **Exploring**: With no forces in the directive, each class starts with a load and an effort that do not balance, and the student can change, move, add and remove forces.
| **Questions about the lever**: Put the lever directive inside an :doc:`activitygroup <activitygroup>` to follow it with questions such as ``gapfill`` or ``multichoice``, which can stay locked until the lever is balanced.
| **Print**: The Print button prints just the lever diagram (and the turning effects table if shown). Print before entering sizes to get a diagram with "?" for the unknown forces.


----

Example 1: Explore all three classes
------------------------------------------

| With no class and no forces, buttons swap between the three classes. Each starts unbalanced. The student can change the sizes, drag the forces and add more.

.. code-block:: rst

    .. lever::

.. lever::

----

Example 2: Class 1 - find the size of the effort
----------------------------------------------------

| The load is fixed. The effort is in a fixed place and the student works out its size.

.. code-block:: rst

    .. lever:: 1

        load 6 at 2 left
        effort ? at 4 right

.. lever:: 1

    load 6 at 2 left
    effort ? at 4 right

----

Example 3: Class 1 - find the position, then release
--------------------------------------------------------

| The effort has a fixed size and the student decides where to put it. ``:hold:`` keeps the lever level until "Release lever" is pressed, and ``:show-moments:`` shows the turning effects table.

.. code-block:: rst

    .. lever:: 1
        :hold:
        :show-moments:

        load 8 at 3 left
        effort 6 at ? right

.. lever:: 1
    :hold:
    :show-moments:

    load 8 at 3 left
    effort 6 at ? right

----

Example 4: Class 2 - wheelbarrow
----------------------------------------------------

| On a class 2 lever the fulcrum is at the end and the effort is an upward force. Here the marks are 10 cm apart and sizes go up in steps of 5 N.

.. code-block:: rst

    .. lever:: 2
        :title: Lifting a wheelbarrow
        :distance-unit: cm
        :spacing: 10
        :max-force: 100
        :step: 5
        :show-moments:

        load 60 N at 20 cm "Soil"
        effort ? at 80 cm "Lift on handles"

.. lever:: 2
    :title: Lifting a wheelbarrow
    :distance-unit: cm
    :spacing: 10
    :max-force: 100
    :step: 5
    :show-moments:

    load 60 N at 20 cm "Soil"
    effort ? at 80 cm "Lift on handles"

----

Example 5: Class 3 - effort between the fulcrum and the load
----------------------------------------------------------------

| On a class 3 lever the upward effort is closer to the fulcrum than the load, so it has to be bigger than the load.

.. code-block:: rst

    .. lever:: 3
        :hold:

        effort ? at 2
        load 4 at 8

.. lever:: 3
    :hold:

    effort ? at 2
    load 4 at 8

----

Example 6: Several weights
----------------------------------------------------

| ``weight`` lines are plain weights. Two weights on the left are balanced by one on the right.

.. code-block:: rst

    .. lever::
        :show-moments:

        weight 4 at 3 left
        weight 2 at 1 left
        weight ? at 2 right

.. lever::
    :show-moments:

    weight 4 at 3 left
    weight 2 at 1 left
    weight ? at 2 right

----

Example 7: Fulcrum close to one end
----------------------------------------------------

| ``:fulcrum: 2`` puts the fulcrum 2 divisions from the left end, like a crowbar. A small effort a long way from the fulcrum balances a large load close to it.

.. code-block:: rst

    .. lever:: 1
        :fulcrum: 2

        load 12 at 1 left
        effort ? at 6 right

.. lever:: 1
    :fulcrum: 2

    load 12 at 1 left
    effort ? at 6 right

----

Example 8: A weight and an upward force on the same side
------------------------------------------------------------

| An upward force can balance a weight on the same side of a class 1 lever. The student chooses both the size and the position of the upward force, and ``:allow-add:`` lets them add more forces.

.. code-block:: rst

    .. lever::
        :allow-add:
        :no-class-label:

        weight 6 at 4 right
        up ? at ? right

.. lever::
    :allow-add:
    :no-class-label:

    weight 6 at 4 right
    up ? at ? right

----

Example 9: Identify the class
----------------------------------------------------

| ``:no-class-label:`` hides the name of the class so students can be asked to identify it. The load can be moved and the size of the effort can be changed.

.. code-block:: rst

    .. lever:: 2
        :no-class-label:
        :no-solution:

        load 8 at 3?
        effort 3? at 6

.. lever:: 2
    :no-class-label:
    :no-solution:

    load 8 at 3?
    effort 3? at 6
