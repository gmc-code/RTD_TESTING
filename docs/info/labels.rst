================================================
Label Diagram Directive Documentation
================================================

The label diagram directive creates an interactive image-labelling exercise with dual interaction support.
Users can drag label tiles from a sorted word bank tray onto designated zones over an image canvas, or click/tap a label to select it and click/tap a zone to place it.

Syntax
-------------------

.. code-block:: rst

    .. label-diagram::
       :image: path/to/image.jpg
       :width: 560
       :height: 500

       * - label: target_label_text
         - pos: x1,y1,x2,y2
         - align: left

Options for the label-diagram directive
---------------------------------------

.. list-table::
   :widths: 25 10 65
   :header-rows: 1

   * - Option
     - Type
     - Description
   * - ``:image:``
     - string
     - | Relative path to the base background image file.
   * - ``:width:``
     - integer
     - | Pixel width of the interactive diagram canvas (default: ``560``).
   * - ``:height:``
     - integer
     - | Pixel height of the interactive diagram canvas (default: ``500``).
   * - ``:font-size:``
     - string
     - | Label font size (default: ``0.95rem``). Accepts values like "0.85rem", "14px", "1.2rem"


| Image Path: Images are automatically detected, bundled, and copied to the Sphinx build output directory.
| Coordinates: The ``pos: x1,y1,x2,y2`` parameter specifies bounding box positions for drop zones.
| Alignment: The ``align:`` key configures label alignment relative to target points (e.g., ``left``, ``right``).
| Interactive Controls: Includes built-in action controls for **Check Answers**, **Show Answers**, and **Reset**.
| Interaction Modes: Supports desktop **Drag and Drop** and mobile/touch **Click-to-Select / Click-to-Place**. Double-clicking a placed label returns it to the word bank tray.

----

Example 1: Diagram Labelling Activity
--------------------------------------

The following example defines a diagram with target bounding boxes mapped onto the background image.

.. code-block:: rst

    ================
    Cells - animal 4
    ================

    | **Year Level:** 8
    | **Strand:** B
    | **Source:** puc.edu/Faculty/Gilbert_Muth/

    .. label-diagram::
        :image: Cells - animal 4.jpg
        :width: 560
        :height: 500

        * - label: nucleus
          - pos: 38,125,113,147
          - align: right
        * - label: endoplasmic reticulum
          - pos: 394,132,554,154
          - align: left
        * - label: golgi
          - pos: 47,304,104,326
          - align: right
        * - label: cell membrane
          - pos: 353,387,460,407
          - align: left



Cells - animal 4
================

| **Year Level:** 8
| **Strand:** B
| **Source:** puc.edu/Faculty/Gilbert_Muth/

.. label-diagram::
   :image: ../diagrams/Cells - animal 4.jpg
   :width: 560
   :height: 500

   * - label: nucleus
     - pos: 38,125,113,147
     - align: right
   * - label: endoplasmic reticulum
     - pos: 394,132,554,154
     - align: left
   * - label: golgi
     - pos: 47,304,104,326
     - align: right
   * - label: cell membrane
     - pos: 353,387,460,407
     - align: left


Example 2: Diagram Labelling Activity
--------------------------------------

The following example defines a diagram with target bounding boxes mapped onto the background image.

.. code-block:: rst

    ==========
    Microscope
    ==========

    | **Year Level:** 8
    | **Strand:** B
    | **Source:** Heinemann Science Links CD's

    .. label-diagram::
        :image: microscope.jpg
        :width: 560
        :height: 500

        * - label: eyepiece lens
          - pos: 348,58,461,80
          - align: left
        * - label: barrel
          - pos: 358,182,421,204
          - align: left
        * - label: objective lens
          - pos: 377,257,489,279
          - align: left
        * - label: stage
          - pos: 391,301,451,323
          - align: left
        * - label: mirror
          - pos: 385,352,449,374
          - align: left
        * - label: base
          - pos: 411,402,468,424
          - align: left
        * - label: fine focus
          - pos: 125,247,211,269
          - align: right
        * - label: coarse focus
          - pos: 128,188,236,210
          - align: right



Microscope
==========

| **Year Level:** 8
| **Strand:** B
| **Source:** Heinemann Science Links CD's

.. label-diagram::
   :image: ../diagrams/microscope.jpg
   :width: 560
   :height: 500

   * - label: eyepiece lens
     - pos: 348,58,461,80
     - align: left
   * - label: barrel
     - pos: 358,182,421,204
     - align: left
   * - label: objective lens
     - pos: 377,257,489,279
     - align: left
   * - label: stage
     - pos: 391,301,451,323
     - align: left
   * - label: mirror
     - pos: 385,352,449,374
     - align: left
   * - label: base
     - pos: 411,402,468,424
     - align: left
   * - label: fine focus
     - pos: 125,247,211,269
     - align: right
   * - label: coarse focus
     - pos: 128,188,236,210
     - align: right

----

Example 3: Diagram Labelling Activity
--------------------------------------

The following example defines a diagram with target bounding boxes mapped onto the background image.

.. code-block:: rst

    ==============
    Classification
    ==============

    | **Year Level:** 7
    | **Strand:** B
    | **Source:** Heinemann Science Links CD's

    .. label-diagram::
        :image: Classification.jpg
        :width: 560
        :height: 500
        :font-size: 0.8rem

        * - label: animals
          - pos: 246,6,334,28
          - align: center
        * - label: vertebrates
          - pos: 110,98,230,120
          - align: center
        * - label: invertebrates
          - pos: 277,98,407,120
          - align: center
        * - label: fish
          - pos: 169,304,227,326
          - align: center
        * - label: amphibians
          - pos: 78,304,166,326
          - align: center
        * - label: reptiles
          - pos: 7,304,73,326
          - align: center
        * - label: birds
          - pos: 124,182,175,204
          - align: center
        * - label: mammals
          - pos: 184,182,271,204
          - align: center
        * - label: arthropods
          - pos: 276,182,360,204
          - align: center
        * - label: molluscs
          - pos: 364,210,453,232
          - align: center
        * - label: worms
          - pos: 464,210,548,232
          - align: center


Classification
==============

| **Year Level:** 7
| **Strand:** B
| **Source:** Heinemann Science Links CD's

.. label-diagram::
   :image: ../diagrams/Classification.jpg
   :width: 560
   :height: 500
   :font-size: 0.8rem

   * - label: animals
     - pos: 246,6,334,28
     - align: center
   * - label: vertebrates
     - pos: 110,98,230,120
     - align: center
   * - label: invertebrates
     - pos: 277,98,407,120
     - align: center
   * - label: fish
     - pos: 169,304,227,326
     - align: center
   * - label: amphibians
     - pos: 78,304,166,326
     - align: center
   * - label: reptiles
     - pos: 7,304,73,326
     - align: center
   * - label: birds
     - pos: 124,182,175,204
     - align: center
   * - label: mammals
     - pos: 184,182,271,204
     - align: center
   * - label: arthropods
     - pos: 276,182,360,204
     - align: center
   * - label: molluscs
     - pos: 364,210,453,232
     - align: center
   * - label: worms
     - pos: 464,210,548,232
     - align: center
