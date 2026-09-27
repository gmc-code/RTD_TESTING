================================================
Word Ordering Directive Documentation
================================================

The wordordering directive creates an interactive word-reordering exercise. Users can drag and drop individual word chips or sentence fragments into their correct sequence to reconstruct a sentence.

Syntax
-------------------

.. code-block:: rst

    .. wordordering::
       :delimiter: ,

       First fragment, second fragment, third fragment.

Options for the wordordering directive
--------------------------------------

.. list-table::
   :widths: 20 10 70
   :header-rows: 1

   * - Option
     - Type
     - Description
   * - ``:delimiter:``
     - string
     - | Custom character used to split the sentence into draggable chips
       | (e.g., ``,`` or ``|``). If omitted, splits automatically by words
       | and inline roles while preserving trailing punctuation.
   * - ``:no-solution:``
     - flag
     - If present, hides the "Show Solution" button from the user.
   * - ``:no-reorder:``
     - flag
     - | If present, keeps the initial fragment order intact for
       | static display or test modes.
   * - ``:no-padding:``
     - flag
     - If present, removes vertical padding from the draggable word chips.
   * - ``:keeprst:``
     - flag
     - | Preserves and renders inline reStructuredText markup and custom
       | Sphinx roles (e.g., ``:participant:`The cat``` or ``**bold**``)
       | directly inside the chips.
   * - ``:theme:``
     - string
     - Set the visual theme. Options are ``white`` (default) or ``light``.
   * - ``:instructions:``
     - string
     - | A brief instruction to guide the user on what to select.
       | defaults to "Classify each item into its correct category:".


| **Structure**: The directive creates an interactive container featuring inline word chips with drag handle controls (☰) for reordering.
| **Tokenization**: By default, sentences are automatically tokenized into word chips with trailing punctuation (like periods, commas, or question marks) attached to the preceding word. Custom delimiters (e.g., ``:delimiter: |``) can be specified to group multiple words into larger draggable fragments.
| **RST & Role Parsing**: Custom Sphinx roles (such as SFL functional roles like ``:participant:`The cat```) and standard inline rST markup are automatically protected during tokenization and rendered cleanly inside the chips.
| **Guaranteed Shuffling**: Word chips are automatically randomized on page render and when clicking the Reset button. The shuffling engine runs up to 50 iterations to guarantee the initial displayed chip order does not match the correct sentence key.
| **Interactive Controls**: Includes built-in **Check**, **Show Solution**, and **Reset** buttons with score validation badges for quick feedback.


----

Split sentence automatically word-by-word
-------------------------------------------

.. code-block:: rst

    .. wordordering::

        Arachnids possess eight jointed legs and two main body sections.


.. wordordering::

    Arachnids possess eight jointed legs and two main body sections.

----

Split sentence into custom phrases using a delimiter
-----------------------------------------------------------

.. code-block:: rst

    .. wordordering::
        :delimiter: |
        :keeprst:

        **Spiders** | use specialized organs called spinnerets | to produce **strong silk thread**.


.. wordordering::
    :delimiter: |
    :keeprst:

    **Spiders** | use specialized organs called spinnerets | to produce **strong silk thread**.

----

Split sentence into custom phrases using a delimiter
-----------------------------------------------------------

.. code-block:: rst

    .. wordordering::
        :delimiter: |

        :circumstance:`Finally`, | :process:`dispose of` | :participant:`the heavy metal waste` | :circumstance:`in the designated container` | and | :process:`clean` | :participant:`the glassware`.



.. wordordering::
    :delimiter: |

    :circumstance:`Finally`, | :process:`dispose of` | :participant:`the heavy metal waste` | :circumstance:`in the designated container` | and | :process:`clean` | :participant:`the glassware`.

----

Split sentence into custom phrases using  roles
----------------------------------------------------------

.. code-block:: rst

    .. wordordering::

        :circumstance:`Finally`, :process:`dispose of` :participant:`the heavy metal waste` :circumstance:`in the designated container` and :process:`clean` :participant:`the glassware`.

.. wordordering::

    :circumstance:`Finally`, :process:`dispose of` :participant:`the heavy metal waste` :circumstance:`in the designated container` and :process:`clean` :participant:`the glassware`.


