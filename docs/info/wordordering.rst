================================================
Word Ordering Directive Documentation
================================================


.. Split sentence automatically word-by-word

.. wordordering::

    Arachnids possess eight jointed legs and two main body sections.


.. Split sentence into custom phrases using a delimiter

.. wordordering::
    :delimiter: |
    :keeprst:

    **Spiders** | use specialized organs called spinnerets | to produce **strong silk thread**.


.. Split sentence into custom phrases using a delimiter

.. wordordering::
    :delimiter: |

    :circumstance:`Finally`, | :process:`dispose of` | :participant:`the heavy metal waste` | :circumstance:`in the designated container` | and | :process:`clean` | :participant:`the glassware`.


.. Split sentence into custom phrases using  roles

.. wordordering::

    :circumstance:`Finally`, :process:`dispose of` :participant:`the heavy metal waste` :circumstance:`in the designated container` and :process:`clean` :participant:`the glassware`.