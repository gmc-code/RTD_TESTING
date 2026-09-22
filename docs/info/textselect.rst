================================================
Textselect Directive Documentation
================================================

The textselect directive creates an interactive text selection exercise with dual interaction support.
Users can click a word to select it. Clicking a selected word again deselects it.
Click drag or shift click to select a range of words.

Syntax
-------------------

.. code-block:: rst

    .. textselect::
       :instructions: Select the Process (action verb).
       :color: green

       {{Place}} the Bunsen burner on the heatproof mat.


----


Options for the textselect directive
--------------------------------------

.. list-table::
    :widths: 20 10 65
    :header-rows: 1

    * - Option
      - Type
      - Description
    * - ``:instructions:``
      - string
      - | A brief instruction to guide the user on what to select.
        | For example, "Select the Theme of the clause."
    * - ``:color:``
      - string
      - | Sets the highlight color and functional role styling for selected text.
        | Options are ``red``, ``participant``, ``green``, ``process``,
        | ``blue``, ``circ``, ``conj``, ``part``, ``theme``, ``rheme``,
        | ``depclause``, ``embedded``, ``relative``, ``projected``.
    * - ``:theme:``
      - string
      - | Sets the visual theme workspace wrapper.
        | Options are ``white`` (default), ``light``.
    * - ``:style:``
      - string
      - | Sets the visual theme style.
        | Options are ``filled`` (default), ``plain``, ``border``.


.. Note:: The directive is currently limited to single-paragraph examples.

----


.. textselect::
    :instructions: Select the Process (action verb).
    :color: green

    {{Observe}} the flame.
    {{Turn off}} the gas.

----

.. textselect::
    :instructions: Select the Participant (noun group).
    :color: red

    Place {{the Bunsen burner}} on the heatproof mat.

----

.. textselect::
    :instructions: Select the Circumstance of Place.
    :color: blue

    Place the Bunsen burner {{on the heatproof mat}}.

----

.. textselect::
    :instructions: Select the Theme of the clause.
    :color: theme

    {{On the top shelf}}, you will find the extra test tubes.

----

.. textselect::
    :instructions: Select the Rheme of the clause.
    :color: rheme

    On the top shelf, {{you will find the extra test tubes}}.

----

.. textselect::
    :instructions: Select the Conjunction (textual theme).
    :color: conj

    {{However}}, the reaction may take longer at room temperature.

----

.. textselect::
    :instructions: Select the Dependent Clause (β-clause).
    :color: depclause

    {{Although the mixture was heated}}, the solid did not fully dissolve.

----

.. textselect::
    :instructions: Select the Embedded Clause [[...]].
    :color: embedded

    The claim {{that the experiment failed}} was contested by the lab team.

----

.. textselect::
    :instructions: Select the Relative Clause.
    :color: relative

    The catalyst {{which was added at the start}} accelerated the oxidation.

----

.. textselect::
    :instructions: Select the Projected Clause.
    :color: projected

    The report stated {{that the pressure had exceeded normal limits}}.

----


Theme choices
-------------------


.. textselect::
    :theme: light
    :color: green
    :instructions: [Theme: light, Style: filled] Select the Process (action verb).
    :style: filled

    {{Place}} the Bunsen burner on the heatproof mat.


.. textselect::
    :theme: light
    :color: green
    :instructions: [Theme: light, Style: border] Select the Process (action verb).
    :style: border

    {{Place}} the Bunsen burner on the heatproof mat.


.. textselect::
    :theme: light
    :color: green
    :instructions: [Theme: light, Style: plain] Select the Process (action verb).
    :style: plain

    {{Place}} the Bunsen burner on the heatproof mat.

