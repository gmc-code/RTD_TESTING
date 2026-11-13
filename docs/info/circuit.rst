================================================
Circuit
================================================

The circuit directive lets students build series and parallel circuits using a 12 V powerpack, ohmic resistors, globes, switches and wires, and measure the current (I) and voltage (V) with ammeters and voltmeters. The circuit is worked out again every time it changes, so the meter readings and the brightness of the globes update as it is built.

Syntax
-------------------

.. code-block:: rst

    .. circuit::

With no content, the student gets a blank board with a powerpack and builds any circuit.

.. code-block:: rst

    .. circuit::

        ammeter, resistor 4 "R1"
        branch: globe
        branch: resistor 6
        voltmeter across R1

With content, the teacher sets the circuit and it is drawn automatically. There are three kinds of line:

.. list-table::
   :widths: 30 70
   :header-rows: 1

   * - Line
     - Description
   * - ``component, component``
     - | One or more components in series, separated by commas.
       | They are drawn in order along the top of the circuit, starting from
       | the + terminal of the powerpack.
   * - ``branch: component, component``
     - | One branch of a parallel section. Two to four ``branch:`` lines in a
       | row make the parallel section. ``branch: wire`` is a branch of plain wire.
   * - ``voltmeter across label``
     - | Connects a voltmeter in parallel with the component with that label.
       | ``voltmeter across supply`` connects it across the powerpack.

Each component is written as:

.. list-table::
   :widths: 30 70
   :header-rows: 1

   * - Component
     - Description
   * - ``resistor 6``
     - | A resistor with its resistance in ohms.
       | ``resistor 6 hidden`` shows "? Ω" so students can work out the
       | resistance from the meter readings (R = V ÷ I).
   * - ``globe``
     - | A globe. It has the resistance set by ``:globe-resistance:``.
       | ``globe 6`` gives this globe its own resistance.
   * - ``ammeter``
     - An ammeter, connected in series where it is written.
   * - ``switch``
     - | A closed switch. ``switch open`` starts open.
       | Students click a switch to open or close it.
   * - ``wire``
     - A piece of wire.
   * - ``"label"``
     - | Optional name in quotes after any component, e.g. ``resistor 6 "Heater"``.
       | Without one, components are named R1, R2 (resistors), L1, L2 (globes),
       | A1, A2 (ammeters), V1, V2 (voltmeters) and S1, S2 (switches).

The unit can be written after a resistance to make the lines easier to read, e.g. ``resistor 6 ohm``. It is ignored.

Options for the circuit directive
--------------------------------------

.. list-table::
   :widths: 24 14 14 48
   :header-rows: 1

   * - Option
     - Type
     - Default
     - Description
   * - ``:title:``
     - string
     - None
     - Title shown above the circuit.
   * - ``:voltage:``
     - number
     - ``12``
     - Voltage of the powerpack.
   * - ``:globe-resistance:``
     - number
     - ``12``
     - | Resistance of each globe in ohms. A globe is treated as an ohmic
       | resistor. It is at full brightness with the whole powerpack voltage across it.
   * - ``:resistors:``
     - list
     - ``2, 3, 4, 6, 12, 24``
     - Resistances the student can choose from when adding a resistor.
   * - ``:tools:``
     - list
     - see below
     - | The components the student can add: ``all``, ``none`` or some of
       | ``wire resistor globe ammeter voltmeter switch``.
       | A blank board has all of them. A circuit set by the teacher has none
       | (it is for measuring) unless this option is used.
   * - ``:build:``
     - string
     - None
     - | A building task for the Check button to mark, e.g.
       | ``series, 2 globes, 1 ammeter`` or
       | ``parallel, 2 resistors, 1 ammeter, 2 voltmeters``.
   * - ``:show-current:``
     - flag
     - Off
     - | If present, arrows on the wires show the direction of the
       | (conventional) current, from + to −.
   * - ``:colour-wires:``
     - flag
     - Off
     - | If present, the wires and component leads of a circuit set by the
       | teacher (and of "Show answer") that are joined to the + terminal
       | are red. The others stay black.
   * - ``:show-values:``
     - flag
     - Off
     - | If present, shows a table of the voltage, current and resistance
       | of every resistor and globe.
   * - ``:decimals:``
     - 0 to 3
     - ``2``
     - Decimal places for the meter readings.
   * - ``:cols:``
     - 4 to 12
     - ``7``
     - | Number of dots across the board. The board grows if the circuit
       | set by the teacher needs more.
   * - ``:rows:``
     - 3 to 10
     - ``5``
     - Number of dots down the board.
   * - ``:no-solution:``
     - flag
     - Off
     - If present, hides the "Show answer" button of a building task.


| **Building**: Choose a component, then click between two dots to place it. Drag along the dots to lay wire quickly. Clicking a place that is already used swaps the component. "Erase" removes components and wire (drag to erase several).
| **Wire colours**: The dots beside the Wire button choose black, red or blue wire, so red wire can be used on the positive side of a circuit and black on the negative side. Clicking or dragging over wire with a different colour chosen recolours it. The leads of a component take the colour of the wire joined to them. The colour is for the student's own bookkeeping and does not change how the circuit works or how it is checked.
| **Ammeters**: An ammeter has no resistance and goes in series. It shows the current through it. An ammeter connected across a component by mistake takes the current around that component, as a real ammeter does.
| **Voltmeters**: A voltmeter has a very high resistance and goes in parallel, across a component. It shows the voltage between its two ends. A voltmeter connected in series by mistake stops the current and reads the powerpack voltage.
| **Globes**: Globes glow more brightly with more voltage across them, so two globes in series are dimmer than two in parallel.
| **Switches**: Click a switch to open or close it. This also works in a circuit set by the teacher.
| **Short circuits**: If a path of wire goes from + to − without passing through a resistor or globe, the powerpack switches off and a warning is shown.
| **Circuits set by the teacher**: The resistors, globes, meters and switches written in the directive cannot be removed. When ``:tools:`` are given, students can add to the circuit and can replace its wires, for example swapping a piece of wire for an ammeter. Rows are left free above the components so there is room to add voltmeters.
| **Check**: With ``:build:``, Check tests the circuit by how it behaves. It counts the resistors and globes that have current in them. ``series`` means the same current goes through all of them. ``parallel`` means each one has the whole powerpack voltage across it. Ammeters must have current in them and voltmeters must show a reading. Extra meters and switches are allowed.
| **Show answer**: Draws one circuit that meets the building task. Changes are then switched off until "Start again" is pressed. It is not available when the building task starts from a circuit set by the teacher.
| **Refreshing the page**: The student's circuit is kept when the page is refreshed. "Start again" clears it.
| **Questions about the circuit**: Put the circuit directive inside an :doc:`activitygroup <activitygroup>` to follow it with questions such as ``gapfill`` or ``multichoice``. With ``:build:``, the questions can stay locked until the circuit is built correctly.
| **Print**: The Print button prints just the circuit diagram with its meter readings (and the values table if shown).


----

Example 1: Blank board
------------------------------------------

| With no content the student can build any circuit. The powerpack is fixed on the left.

.. code-block:: rst

    .. circuit::

.. circuit::

----

Example 2: Series circuit to measure
----------------------------------------------------

| A circuit set by the teacher. The ammeter is in series and a voltmeter is across each globe. The globes share the 12 V.

.. code-block:: rst

    .. circuit::
        :title: Two globes in series

        ammeter, globe, wire, globe
        voltmeter across L1
        voltmeter across L2

.. circuit::
    :title: Two globes in series

    ammeter, globe, wire, globe
    voltmeter across L1
    voltmeter across L2

----

Example 3: Parallel circuit to measure
----------------------------------------------------

| An ammeter measures the total current and one more is in each branch. The branch currents add up to the total current.

.. code-block:: rst

    .. circuit::
        :title: Two resistors in parallel
        :show-current:

        ammeter, wire
        branch: ammeter, resistor 4, wire
        branch: ammeter, resistor 6, wire
        voltmeter across R1
        voltmeter across R2

.. circuit::
    :title: Two resistors in parallel
    :show-current:

    ammeter, wire
    branch: ammeter, resistor 4, wire
    branch: ammeter, resistor 6, wire
    voltmeter across R1
    voltmeter across R2

----

Example 4: Find the resistance
----------------------------------------------------

| ``hidden`` hides the resistance. Students use the readings and R = V ÷ I.

.. code-block:: rst

    .. circuit::
        :title: What is the resistance of Rx?

        ammeter, resistor 8 hidden "Rx", resistor 4
        voltmeter across Rx

.. circuit::
    :title: What is the resistance of Rx?

    ammeter, resistor 8 hidden "Rx", resistor 4
    voltmeter across Rx

----

Example 5: Switches
----------------------------------------------------

| Each globe is on its own branch with its own switch, and S1 controls both. Students click the switches.

.. code-block:: rst

    .. circuit::

        switch "S1", ammeter
        branch: switch open "S2", globe
        branch: switch open "S3", globe

.. circuit::

    switch "S1", ammeter
    branch: switch open "S2", globe
    branch: switch open "S3", globe

----

Example 6: Build a series circuit
----------------------------------------------------

| ``:build:`` sets the task. Check tests that there are two globes in series and that the ammeter and voltmeter are connected so they work.

.. code-block:: rst

    .. circuit::
        :title: Build a series circuit with 2 globes. Measure the current, and the voltage across one globe.
        :build: series, 2 globes, 1 ammeter, 1 voltmeter

.. circuit::
    :title: Build a series circuit with 2 globes. Measure the current, and the voltage across one globe.
    :build: series, 2 globes, 1 ammeter, 1 voltmeter

----

Example 7: Build a parallel circuit
----------------------------------------------------

| ``:tools:`` leaves out the globes and ``:resistors:`` sets the resistances to choose from.

.. code-block:: rst

    .. circuit::
        :title: Build a parallel circuit with 2 resistors and an ammeter for the total current.
        :build: parallel, 2 resistors, 1 ammeter
        :tools: wire resistor ammeter voltmeter
        :resistors: 4, 6, 12

.. circuit::
    :title: Build a parallel circuit with 2 resistors and an ammeter for the total current.
    :build: parallel, 2 resistors, 1 ammeter
    :tools: wire resistor ammeter voltmeter
    :resistors: 4, 6, 12

----

Example 8: Add the meters
----------------------------------------------------

| The circuit is set and the student adds the meters. To add the ammeter, a piece of wire is swapped for it. The voltmeter goes in the free row above a resistor, with wire down to each side of it.

.. code-block:: rst

    .. circuit::
        :title: Add an ammeter and a voltmeter to find the resistance of R1.
        :tools: wire ammeter voltmeter
        :build: 1 ammeter, 1 voltmeter

        resistor 6 hidden, resistor 12

.. circuit::
    :title: Add an ammeter and a voltmeter to find the resistance of R1.
    :tools: wire ammeter voltmeter
    :build: 1 ammeter, 1 voltmeter

    resistor 6 hidden, resistor 12

----

Example 9: Series and parallel together
----------------------------------------------------

| A resistor in series with a parallel section. ``:show-values:`` adds the table of values, and a voltmeter is across the supply.

.. code-block:: rst

    .. circuit::
        :show-values:

        ammeter, resistor 2, wire
        branch: resistor 6
        branch: resistor 12
        voltmeter across R1
        voltmeter across R2
        voltmeter across supply

.. circuit::
    :show-values:

    ammeter, resistor 2, wire
    branch: resistor 6
    branch: resistor 12
    voltmeter across R1
    voltmeter across R2
    voltmeter across supply

----

Example 10: With questions
----------------------------------------------------

| Inside an :doc:`activitygroup <activitygroup>`, the questions unlock when the circuit has been built and checked.

.. code-block:: rst

    .. activitygroup::
        :reveal: check

        .. circuit::
            :title: Build a series circuit with 2 globes and an ammeter.
            :build: series, 2 globes, 1 ammeter

        .. gapfill::

            The ammeter reads @@0.50 | 1.00 | 2.00@@ A. If a third globe is added in series, the current @@decreases | increases | stays the same@@.

.. activitygroup::
    :reveal: check

    .. circuit::
        :title: Build a series circuit with 2 globes and an ammeter.
        :build: series, 2 globes, 1 ammeter

    .. gapfill::

        The ammeter reads @@0.50 | 1.00 | 2.00@@ A. If a third globe is added in series, the current @@decreases | increases | stays the same@@.

----

Example 11: Coloured wires
----------------------------------------------------

| ``:colour-wires:`` draws the wires and leads joined to the + terminal in red. With ``:tools:``, the student can add more wire in black, red or blue.

.. code-block:: rst

    .. circuit::
        :colour-wires:
        :tools: wire ammeter voltmeter

        wire, ammeter, globe, globe

.. circuit::
    :colour-wires:
    :tools: wire ammeter voltmeter

    wire, ammeter, globe, globe
