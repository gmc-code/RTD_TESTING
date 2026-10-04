================================================
Quiz Group Directive
================================================

| The quizgroup directive creates a group of quiz questions.
| This diretive allows you to mix and match multiple choice questions (.. multichoice::), cloze fill-in-the-blank questions (.. cloze::), and any other custom question types inside a single group container with unified scoring, progress tracking, and navigation.

----

Syntax
-------------------

.. code-block:: rst

    .. quizgroup::
        :nav-position: both
        :shuffle-questions:
        :num-questions: 2

        .. multichoice::
            :theme: light

            Which component of a plant cell makes energy?

            [ ] Chloroplast  | Incorrect.
            [x] Mitochondria | Correct!


        .. cloze:: python
            :show-code:

            def @@square@@(val):
                return val @@*@@ val


----

Options for the quizgroup directive
--------------------------------------

.. list-table::
   :widths: 35 10 15 45
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
     - Displays the "Instant Feedback" checkbox control in the group action bar.
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

Quiz Group --mcq, cloze -- both navbar position
---------------------------------------------------

.. code-block:: rst

    .. quizgroup::
        :nav-position: both
        :show-instant-feedback:
        :enable-instant-feedback:
        :shuffle-questions:
        :num-questions: 5

        .. cloze:: python
            :instructions: Complete the following code.
            :show-code:

            def @@square@@(val):
                return val @@*@@ val


        .. multichoice::

            What is the chemical symbol for Silver?

            [ ] Au | Incorrect.
            [x] Ag | Correct!


        .. gapfill::
            :instructions: Choose the correct option from the dropdowns below.

            To execute code conditionally, use the @@if | None | else@@ keyword followed by an expression.


        .. classifying::
            :instructions: Select the correct grammatical function for each nominal group element.
            :bins: Pointer, Describer, Classifier, Thing, Qualifier
            :nosort:

            The: Pointer
            dense: Describer
            oceanic: Classifier
            crust: Thing
            at the subduction zone: Qualifier


        .. fillin::

            You can return a range of characters by using the @@slice@@ syntax.
            Specify the start index and the end index, separated by a @@colon@@, to return a part of the string.



.. quizgroup::
    :nav-position: both
    :show-instant-feedback:
    :enable-instant-feedback:
    :shuffle-questions:
    :num-questions: 11

    .. cloze:: python
        :instructions: Complete the following code.
        :show-code:

        def @@square@@(val):
            return val @@*@@ val


    .. multichoice::

        What is the chemical symbol for Silver?

        [ ] Au | Incorrect.
        [x] Ag | Correct!


    .. gapfill::
        :instructions: Choose the correct option from the dropdowns below.

        To execute code conditionally, use the @@if | None | else@@ keyword followed by an expression.


    .. classifying::
        :instructions: Select the correct grammatical function for each nominal group element.
        :bins: Pointer, Describer, Classifier, Thing, Qualifier
        :nosort:

        The: Pointer
        dense: Describer
        oceanic: Classifier
        crust: Thing
        at the subduction zone: Qualifier


    .. fillin::

        You can return a range of characters by using the @@slice@@ syntax.
        Specify the start index and the end index, separated by a @@colon@@, to return a part of the string.



----

NOT in group yet --wordjumble, wordordering, ordering
---------------------------------------------------------

.. wordjumble::
    :keep-first-two:
    :keep-last:
    :letters: 2

        roots cells seeds

.. wordordering::
    :delimiter: |

    :circumstance:`Finally`, | :process:`dispose of` | :participant:`the heavy metal waste` | :circumstance:`in the designated container` | and | :process:`clean` | :participant:`the glassware`.


.. ordering::
    :show-code:

    def hello_world():
        print("Hello World")


.. ordering::
    :paragraph:
    :keeprst:

    The **platypus** is a very unusual animal from eastern Australia. It has a bill like a duck, a tail like a beaver, and webbed feet for swimming. Its thick fur keeps it warm and dry in cold river water.


.. ordering::
    :paragraphblocks:
    :keeprst:

    The **platypus** is a very unusual animal from eastern Australia. It has a bill like a duck, a tail like a beaver, and webbed feet for swimming. Its thick fur keeps it warm and dry in cold river water.

    This animal is special because it lays **eggs** instead of giving birth to live babies. It hunts underwater with its eyes and ears closed. Instead, its bill can feel tiny electrical signals from swimming bugs and shrimp. Male platypuses also have sharp, **venomous spurs** on their back legs for protection.

    Today, platypuses face big problems in the wild. Building dams and cutting down trees ruins their river homes. Trash in the water can also hurt them. People are working hard to clean up rivers so the platypus stays safe.


.. textselect::
    :instructions: Select the Qualifier of the noun group.
    :color: qualifier

    The test tube {{on the rack}} contains acid.

