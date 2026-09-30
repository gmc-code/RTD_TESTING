================================================
Classifying Directive Documentation
================================================

The classifying directive creates an interactive categorization activity.
Users read a series of statements or code snippets and use dropdown menus to sort each item into its correct target category or structural "bin".

Syntax
-------------------

.. code-block:: rst

    .. classifying::

       Item content text goes here: Category 1
       Another item content statement: Category 2

----

Options for the classifying directive
--------------------------------------

.. list-table::
   :widths: 25 15 60
   :header-rows: 1

   * - Option
     - Type
     - Description
   * - ``:bins:``
     - string
     - | Optional comma-separated list of category names (supports 2 to 6 distinct classifications).
       | Overrides category auto-detection. By default, unique categories are auto-collected and sorted alphabetically (A-Z).
   * - ``:delimiter:`` / ``:sep:``
     - string
     - | Custom separator string used to split the item text from its target category (e.g., ``=>``, ``::``, ``|``).
       | Useful when item text contains colons. Defaults to splitting on the last colon (``rsplit``) if omitted, allowing inline roles like ``:process:`word``` to work seamlessly.
   * - ``:solution:``
     - flag / string
     - | Displays a **Solution** button alongside Check and Reset.
       | Can be passed as a flag (``:solution:``) or as a string value (``:solution: true`` / ``:solution: yes``).
   * - ``:instructions:``
     - string
     - | Custom instruction text displayed at the top of the block.
       | Defaults to ``"Classify each item into its correct category:"``.
   * - ``:theme:``
     - string
     - | Sets the visual theme wrapper.
       | Options are ``white`` (default) or ``light``.
   * - ``:sort:``
     - string / boolean
     - | Controls item shuffling behavior.
       | Accepts ``true``/``false`` or ``yes``/``no``. Default is ``true``.
   * - ``:nosort:``
     - flag
     - | Optional flag to disable random item shuffling and
       | preserve the exact list order specified in the directive content.
   * - ``:shuffle:``
     - flag
     - | Optional flag to explicitly enable random item shuffling.


| Syntax Rules: Items inside the body are mapped using key-value syntax formatted as ``Item Text: Category Name``.
| Category Resolution: If the ``:bins:`` option is omitted, it auto-collects all unique categories from the items and sorts them alphabetically (aA to zZ)
| Shuffling: Items are automatically shuffled on page render and on Reset button click unless ``:sort: false`` or ``:nosort:`` is specified.
| Visual Badges: When validated, inline symbols provide quick feedback right alongside choices.


----

Example 1: Default white theme
--------------------------------------------

| The following example demonstrates sorting core Python language features into either syntax operators or built-in data structures.
| It uses the default white theme.

.. code-block:: rst

    .. classifying::

       + (Addition / Concatenation): Operators
       list (Sequential collection): Data Structures
       == (Equality comparison): Operators
       dict (Key-value mapping): Data Structures
       tuple (Immutable sequence): Data Structures

.. classifying::

   + (Addition / Concatenation): Operators
   list (Sequential collection): Data Structures
   == (Equality comparison): Operators
   dict (Key-value mapping): Data Structures
   tuple (Immutable sequence): Data Structures

----

Example 2: Light theme
-----------------------------------------------------------

| The following example uses the ``:theme: light`` setting.
| It demonstrates sorting arithmetic and logical operators into their respective categories.

.. code-block:: rst

    .. classifying::
       :theme: light

       // (Floor division): Arithmetic
       and (Short-circuit conjunction): Logical
       % (Modulo remainder): Arithmetic
       not (Boolean inversion): Logical
       ** (Exponentiation power): Arithmetic

.. classifying::
   :theme: light

   // (Floor division): Arithmetic
   and (Short-circuit conjunction): Logical
   % (Modulo remainder): Arithmetic
   not (Boolean inversion): Logical
   ** (Exponentiation power): Arithmetic

----

Example 3: Maximum of 6 bins
------------------------------------------------

Demonstrating a 6-bin categorization activity.

.. code-block:: rst

    .. classifying::

       Basalt: Igneous
       Sandstone: Sedimentary
       Marble: Metamorphic
       Quartz: Mineral
       Trilobite: Fossil
       Coal: Organic

.. classifying::

   Basalt: Igneous
   Sandstone: Sedimentary
   Marble: Metamorphic
   Quartz: Mineral
   Trilobite: Fossil
   Coal: Organic

----

Example 4: Items with various brackets
------------------------------------------------

| The following example demonstrates sorting Python data structures into either mutable or immutable categories.
| It shows items with different types of brackets.

.. code-block:: rst

    .. classifying::

       Lists (e.g., [1, 2, 3]): Mutable
       Tuples (e.g., (1, 2, 3)): Immutable
       Strings (e.g., "Hello"): Immutable
       Dictionaries (e.g., {"a": 1}): Mutable

.. classifying::

   Lists (e.g., [1, 2, 3]): Mutable
   Tuples (e.g., (1, 2, 3)): Immutable
   Strings (e.g., "Hello"): Immutable
   Dictionaries (e.g., {"a": 1}): Mutable

----

Example 5: Preserving Order and Custom Bin Order
------------------------------------------------

| Demonstrating how to preserve exact line order using ``:sort: false`` alongside explicit dropdown menu bin ordering via ``:bins:``.

.. code-block:: rst

    .. classifying::
       :bins: Pointer, Describer, Classifier, Thing, Qualifier
       :sort: false

       The: Pointer
       dense: Describer
       oceanic: Classifier
       crust: Thing
       at the subduction zone: Qualifier

.. classifying::
   :bins: Pointer, Describer, Classifier, Thing, Qualifier
   :sort: false

   The: Pointer
   dense: Describer
   oceanic: Classifier
   crust: Thing
   at the subduction zone: Qualifier


.. code-block:: rst

    .. classifying::
       :bins: Classifier, Describer, Pointer, Qualifier, Thing
       :sort: false

       The: Pointer
       dense: Describer
       oceanic: Classifier
       crust: Thing
       at the subduction zone: Qualifier

.. classifying::
   :bins: Classifier, Describer, Pointer, Qualifier, Thing
   :sort: false

   The: Pointer
   dense: Describer
   oceanic: Classifier
   crust: Thing
   at the subduction zone: Qualifier

----

Example 6: Solution and custom instructions
------------------------------------------------

| Demonstrating how to provide a solution to a categorization activity.

.. code-block:: rst

    .. classifying::
        :instructions: Select the correct grammatical function for each nominal group element.
        :bins: Pointer, Describer, Classifier, Thing, Qualifier
        :solution:
        :nosort:

        The: Pointer
        dense: Describer
        oceanic: Classifier
        crust: Thing
        at the subduction zone: Qualifier

.. classifying::
    :instructions: Select the correct grammatical function for each nominal group element.
    :bins: Pointer, Describer, Classifier, Thing, Qualifier
    :solution:
    :nosort:

    The: Pointer
    dense: Describer
    oceanic: Classifier
    crust: Thing
    at the subduction zone: Qualifier

