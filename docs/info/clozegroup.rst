================================================
Cloze Group Directive
================================================

| The clozegroup directive creates a group of cloze questions.
| It is used to group related questions together and provide a unified interface for students to answer them.
| It is a container directive, which means that it can contain multiple instances of the cloze directive.

----

Syntax
-------------------

.. code-block:: rst

    .. clozegroup::
        :nav-position: both
        :num-questions: 2
        :show_instant_feedback:

            .. cloze:: python
                :show-code:

                def @@add@@(a, b):
                    return a @@+@@ b

            .. cloze:: python

                for @@i@@ in range(10):
                    @@print@@(i)

----

Options for the clozegroup directive
--------------------------------------


.. list-table::
   :widths: 35 10 15 40
   :header-rows: 1

   * - Option
     - Type
     - Default
     - Description
   * - | ``:nav-position:`` /
       | ``:nav_position:``
     - String
     - bottom
     - Sets the position of the navigation controls. Valid values are "top", "bottom", or "both".
   * - | ``:show-instant-feedback:`` /
       | ``:show_instant_feedback:``
     - Flag
     - Off
     - Displays the "Instant Feedback" checkbox control in the header bar for user toggling.
   * - | ``:enable-instant-feedback:`` /
       | ``:enable_instant_feedback:``
     - Flag
     - Off
     - Causes the "Instant Feedback" checkbox to be checked by default when displayed.
   * - | ``:shuffle-questions:`` /
       | ``:shuffle_questions:``
     - Flag
     - Off
     - Randomizes the order of questions in the group.
   * - | ``:num-questions:`` /
       | ``:num_questions:``
     - Integer
     - All questions
     - Limits the number of questions displayed in the group. If set, a random subset of questions will be shown.

----

Grouped Multiple Choice -- default navbar position
---------------------------------------------------

.. code-block:: rst

    .. clozegroup::
        :nav-position: both
        :num-questions: 2
        :show-instant-feedback:

        .. cloze:: python
            :show-code:

            def @@add@@(a, b):
                return a @@+@@ b

        .. cloze:: python

            for @@i@@ in range(10):
                @@print@@(i)


.. clozegroup::
    :nav-position: both
    :num-questions: 2
    :show-instant-feedback:

    .. cloze:: python
        :show-code:

        def @@add@@(a, b):
            return a @@+@@ b

    .. cloze:: python

        for @@i@@ in range(10):
            @@print@@(i)




