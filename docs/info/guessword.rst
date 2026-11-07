Guess the word
==============

``guessword`` is a classroom word-guessing game, a school-friendly
replacement for hangman.

Option reference
----------------

.. list-table::
   :header-rows: 1
   :widths: 18 82

   * - Option
     - What it does
   * - *(word)*
     - The word or phrase to guess, written after ``.. guessword::``. For
       several words, leave this out and put one word per line in the
       content instead.
   * - ``:image:``
     - Which picture: ``snowman`` (default), ``beaker``, ``balloons``, ``flower``,
       ``battery``, ``thermometer``, ``machine`` (a Rube Goldberg
       machine; ``rubegoldberg`` also works), ``rocket``, ``circuit``,
       ``pendulum``, ``daynight``, ``moon``, ``fuse`` or ``volcano``.
       ``random`` gives a different picture for each word. A
       comma-separated list, such as ``rocket, fuse, machine``, picks
       randomly from just those. (Older pages used ``:theme:`` for the
       picture. That still works, but the build shows a warning asking you
       to change it to ``:image:``.)
   * - ``:theme:``
     - Colour theme: ``light`` (default), ``dark``, ``auto`` (match the
       computer), ``ocean``, ``forest``, ``sunset`` or ``contrast`` (black
       and white with strong colours, good on a projector). The same seven colour themes work in ``flashquiz``, ``flashcards``, ``crossword``, ``wordsearch`` and ``guessword``. On
       dark themes the picture stays on a light panel so it looks right.
       Printing is always black and white.
   * - ``:hint:``
     - Hint for the single-word form. Students reveal it with a button.
       In the multi-word form, put the hint after a ``|`` on each line.
   * - ``:lives:``
     - Wrong guesses allowed, 3 to 12. Default 6. Each picture has 12
       parts, so with 12 lives one part changes per wrong guess. With
       fewer lives, several parts change at once.
   * - ``:title:``
     - Heading above the game and on the worksheet. Default "Guess the
       word".
   * - ``:shuffle:``
     - Randomise the order of the words each time through. The printed
       worksheet always uses the order you wrote.
   * - ``:answers:``
     - ``none`` (default) prints the worksheet only. ``print`` adds an
       answer key on a separate page.
   * - ``:hemisphere:``
     - ``south`` (default) or ``north``. Only affects the ``daynight``
       and ``moon`` pictures. In the southern hemisphere the sun crosses
       the northern sky from right to left, and a waning moon is lit on
       the right. ``north`` shows the mirror image.
   * - ``:no-settings:``
     - Hides the ⚙ settings button, so students can't change the picture,
       the number of wrong guesses, the colour theme or the hint button.
       Useful for a class challenge where everyone should have the same
       game.
   * - ``:class:``
     - Extra CSS classes on the game box.

Notes
-----

* Spaces, hyphens, apostrophes and digits are shown automatically; only
  the letters A to Z are guessed. Accented letters count as their plain
  letter.
* Answers are base64-encoded in the page source, so they are not
  readable at a glance.
* The worksheet prints words in the order you wrote them, even with
  ``:shuffle:``, so the sheet and answer key always match.

How it works
------------

Each wrong guess moves a picture one step closer to the end: a snowman
melts, a beaker overflows, balloons pop, a flower loses its petals, a
battery drains, a thermometer rises into the red, or a Rube Goldberg
machine runs one more step towards ringing its bell, a rocket counts
down to lift-off, a circuit overloads, a clock ticks towards midnight, the
sun sets, the moon wanes, a fuse burns down to a firework, or a volcano
erupts. Some
pictures also move all the time, such as the pendulum, the current in the
circuit, the fuse spark, the stars and the volcano's smoke. This motion is switched off for
anyone whose device is set to reduce motion. With 12 chances, each
wrong guess changes one part of the picture. The guesses-left counter sits under the
picture.

Students can click the on-screen letters or just type them on the
keyboard; there's no need to click the game first. Typed letters go to the
game you last used, which gets a blue border. If you haven't used one yet,
they go to the game most visible on screen. Press :kbd:`Enter` after a
round to move on. Typing in a search box or other text field is never
treated as a guess.

Each game has a **🖨 Print** button that prints just that game as a blank
worksheet, with the answer key on a second page if ``:answers: print`` is
set. Printing the whole page from the browser also gives blank games.

The **⚙** button opens settings for that game:

* **Picture**: the default (from ``:image:``), random for each word,
  or any one picture. It changes straight away and keeps the game's
  progress.
* **Wrong guesses allowed**: 3 to 12. If letters have already been guessed
  in the current word, the new number starts with the next word, so moving
  the slider can't win or lose a round.
* **Theme**: any of the colour themes (see ``:theme:``).
* **Show the hint button**: hide it for a harder game.
* **Reset settings** undoes all of these.

Choices are saved in that browser, separately for each game. The words
never change. **🖨 Print** uses the picture and number of wrong guesses
showing on screen, so a teacher can set up the game and print it. Add
``:no-settings:`` to hide the button.

Each example below shows the RST first, then the game it makes.

Snowman (default)
-----------------

.. code-block:: rst

   .. guessword:: evaporation
      :hint: Liquid turning into a gas below its boiling point
      :lives: 12

.. guessword:: evaporation
   :hint: Liquid turning into a gas below its boiling point
   :lives: 12

Beaker
------

.. code-block:: rst

   .. guessword:: photosynthesis
      :image: beaker
      :hint: How plants make glucose
      :lives: 12

.. guessword:: photosynthesis
   :image: beaker
   :hint: How plants make glucose
   :lives: 12

Balloons, several words
-----------------------

Put one word or phrase per line. A hint can follow a ``|``. Lines that
start with ``#`` are ignored.

.. code-block:: rst

   .. guessword::
      :image: balloons
      :title: Cells revision
      :lives: 12
      :shuffle:

      mitochondria | Where respiration happens
      cell membrane | Controls what enters and leaves
      chloroplast | Contains chlorophyll
      nucleus

.. guessword::
   :image: balloons
   :title: Cells revision
   :lives: 12
   :shuffle:

   mitochondria | Where respiration happens
   cell membrane | Controls what enters and leaves
   chloroplast | Contains chlorophyll
   nucleus

Flower
------

Each wrong guess drops a petal. On the last one the flower wilts.

.. code-block:: rst

   .. guessword:: pollination
      :image: flower
      :hint: Moving pollen from one flower to another
      :lives: 12

.. guessword:: pollination
   :image: flower
   :hint: Moving pollen from one flower to another
   :lives: 12

Battery
-------

Each wrong guess empties a bar, from green down to red, until the battery
is flat.

.. code-block:: rst

   .. guessword:: circuit
      :image: battery
      :hint: A closed loop that current flows around
      :lives: 12

.. guessword:: circuit
   :image: battery
   :hint: A closed loop that current flows around
   :lives: 12

Thermometer
-----------

Each wrong guess raises the temperature one mark. The top three marks are
the danger zone, and heat waves appear when it overheats.

.. code-block:: rst

   .. guessword:: temperature
      :image: thermometer
      :hint: How hot or cold something is
      :lives: 12

.. guessword:: temperature
   :image: thermometer
   :hint: How hot or cold something is
   :lives: 12

Rube Goldberg machine
---------------------

A chain reaction, one step per wrong guess. A ball rolls down two ramps
and knocks over four dominoes. The last domino pushes a second ball onto
a seesaw, which flings a weight up into a bell. When the bell rings, the
round is lost.

.. code-block:: rst

   .. guessword:: kinetic energy
      :image: machine
      :hint: The energy an object has because it is moving
      :lives: 12

.. guessword:: kinetic energy
   :image: machine
   :hint: The energy an object has because it is moving
   :lives: 12

Rocket
------

The countdown board ticks down from T-12 with each wrong guess. The
gantry arms swing away, the fuel hose drops, smoke builds and the engines
fire. At zero the rocket lifts off without you.

.. code-block:: rst

   .. guessword:: gravity
      :image: rocket
      :hint: The force that pulls objects towards Earth
      :lives: 12

.. guessword:: gravity
   :image: rocket
   :hint: The force that pulls objects towards Earth
   :lives: 12

Circuit
-------

Current flows round the circuit. With each wrong guess the pulse moves on
and lights the next bulb, until the last bulb overloads and blows.

.. code-block:: rst

   .. guessword:: resistance
      :image: circuit
      :hint: How much a component opposes the flow of current
      :lives: 12

.. guessword:: resistance
   :image: circuit
   :hint: How much a component opposes the flow of current
   :lives: 12

Pendulum clock
--------------

The pendulum swings while the hour hand moves on one hour per wrong
guess and the weight drops. At midnight the cuckoo pops out.

.. code-block:: rst

   .. guessword:: frequency
      :image: pendulum
      :hint: The number of swings or waves per second
      :lives: 12

.. guessword:: frequency
   :image: pendulum
   :hint: The number of swings or waves per second
   :lives: 12

Day to night
------------

The sun arcs across the sky and sets, the sky turns orange then dark
blue, the moon rises and the stars come out. By default this is the
southern-hemisphere view, looking north, so the sun moves from right to
left. Add ``:hemisphere: north`` for the northern view.

.. code-block:: rst

   .. guessword:: rotation
      :image: daynight
      :hint: Earth spinning on its axis causes day and night
      :lives: 12

.. guessword:: rotation
   :image: daynight
   :hint: Earth spinning on its axis causes day and night
   :lives: 12

Moon phases
-----------

The moon starts full and wanes, through gibbous, third quarter and
crescent, to a new moon. The name of each phase is shown under the moon.
By default this is the southern-hemisphere view, where a waning moon is lit
on the right. Add ``:hemisphere: north`` for the northern view, which is lit
on the left.

.. code-block:: rst

   .. guessword:: waning crescent
      :image: moon
      :hint: The phase just before a new moon
      :lives: 12

.. guessword:: waning crescent
   :image: moon
   :hint: The phase just before a new moon
   :lives: 12

Northern hemisphere view
------------------------

The same two pictures with ``:hemisphere: north``: the sun moves left to
right, and the waning moon is lit on the left.

.. code-block:: rst

   .. guessword:: equinox
      :image: daynight
      :hemisphere: north
      :hint: When day and night are the same length
      :lives: 12

   .. guessword:: gibbous
      :image: moon
      :hemisphere: north
      :hint: More than half lit, but not full
      :lives: 12

.. guessword:: equinox
   :image: daynight
   :hemisphere: north
   :hint: When day and night are the same length
   :lives: 12

.. guessword:: gibbous
   :image: moon
   :hemisphere: north
   :hint: More than half lit, but not full
   :lives: 12

Fuse
----

A spark burns along a wiggly fuse. When it reaches the firework, the
firework launches and bursts.

.. code-block:: rst

   .. guessword:: combustion
      :image: fuse
      :hint: A reaction where a fuel burns in oxygen
      :lives: 12

.. guessword:: combustion
   :image: fuse
   :hint: A reaction where a fuel burns in oxygen
   :lives: 12

Volcano
-------

The crater starts to glow, smoke builds and the ground rumbles. Lava
creeps down both sides, an ash cloud forms and rocks fly, until the
volcano erupts.

.. code-block:: rst

   .. guessword:: igneous rock
      :image: volcano
      :hint: Rock formed when magma or lava cools
      :lives: 12

.. guessword:: igneous rock
   :image: volcano
   :hint: Rock formed when magma or lava cools
   :lives: 12

Random pictures
---------------

``:image: random`` gives each word a different picture, chosen at random
and never the same twice in a row. To pick from a shortlist, list the
pictures with commas.

.. code-block:: rst

   .. guessword::
      :image: random
      :title: Energy revision
      :lives: 12
      :shuffle:

      kinetic | Energy of a moving object
      thermal | Energy of a hot object
      chemical | Energy stored in food and fuels
      elastic | Energy stored in a stretched spring
      gravitational | Energy of a raised object

   .. guessword::
      :image: rocket, fuse, machine
      :title: Forces and motion
      :lives: 12

      acceleration | Change in speed per second
      momentum | Mass times velocity
      inertia | Resistance to a change in motion

.. guessword::
   :image: random
   :title: Energy revision
   :lives: 12
   :shuffle:

   kinetic | Energy of a moving object
   thermal | Energy of a hot object
   chemical | Energy stored in food and fuels
   elastic | Energy stored in a stretched spring
   gravitational | Energy of a raised object

.. guessword::
   :image: rocket, fuse, machine
   :title: Forces and motion
   :lives: 12

   acceleration | Change in speed per second
   momentum | Mass times velocity
   inertia | Resistance to a change in motion

Fewer chances (hard mode)
-------------------------

``:lives: 3`` is the minimum. Each wrong guess changes four parts of the
picture at once, so a round is over quickly. It suits short words, confident
classes, or a quick challenge at the end of a lesson.

.. code-block:: rst

   .. guessword:: atom
      :lives: 3
      :hint: The smallest particle of an element

   .. guessword:: cell
      :image: beaker
      :lives: 3
      :hint: The basic unit of life

   .. guessword::
      :image: balloons
      :title: Forces challenge
      :lives: 3

      gravity | Pulls objects towards Earth
      friction | Slows moving surfaces
      newton | The unit of force

   .. guessword:: leaf
      :image: flower
      :lives: 3
      :hint: Where photosynthesis mostly happens

   .. guessword:: volt
      :image: battery
      :lives: 3
      :hint: The unit of voltage

   .. guessword:: heat
      :image: thermometer
      :lives: 3
      :hint: Energy that flows from hot to cold

   .. guessword:: lever
      :image: machine
      :lives: 3
      :hint: A simple machine that turns about a pivot

   .. guessword:: orbit
      :image: rocket
      :lives: 3
      :hint: The path of a satellite around a planet

   .. guessword:: ohm
      :image: circuit
      :lives: 3
      :hint: The unit of resistance

   .. guessword:: swing
      :image: pendulum
      :lives: 3
      :hint: What a pendulum does

   .. guessword:: dusk
      :image: daynight
      :lives: 3
      :hint: The time just after sunset

   .. guessword:: lunar
      :image: moon
      :lives: 3
      :hint: To do with the moon

   .. guessword:: spark
      :image: fuse
      :lives: 3
      :hint: A tiny flash that can start a fire

   .. guessword:: lava
      :image: volcano
      :lives: 3
      :hint: Molten rock that reaches the surface

.. guessword:: atom
   :lives: 3
   :hint: The smallest particle of an element

.. guessword:: cell
   :image: beaker
   :lives: 3
   :hint: The basic unit of life

.. guessword::
   :image: balloons
   :title: Forces challenge
   :lives: 3

   gravity | Pulls objects towards Earth
   friction | Slows moving surfaces
   newton | The unit of force

.. guessword:: leaf
   :image: flower
   :lives: 3
   :hint: Where photosynthesis mostly happens

.. guessword:: volt
   :image: battery
   :lives: 3
   :hint: The unit of voltage

.. guessword:: heat
   :image: thermometer
   :lives: 3
   :hint: Energy that flows from hot to cold

.. guessword:: lever
   :image: machine
   :lives: 3
   :hint: A simple machine that turns about a pivot

.. guessword:: orbit
   :image: rocket
   :lives: 3
   :hint: The path of a satellite around a planet

.. guessword:: ohm
   :image: circuit
   :lives: 3
   :hint: The unit of resistance

.. guessword:: swing
   :image: pendulum
   :lives: 3
   :hint: What a pendulum does

.. guessword:: dusk
   :image: daynight
   :lives: 3
   :hint: The time just after sunset

.. guessword:: lunar
   :image: moon
   :lives: 3
   :hint: To do with the moon

.. guessword:: spark
   :image: fuse
   :lives: 3
   :hint: A tiny flash that can start a fire

.. guessword:: lava
   :image: volcano
   :lives: 3
   :hint: Molten rock that reaches the surface

Printed worksheet and answer key
--------------------------------

Press **🖨 Print** on any game to print it as a worksheet. It has the
title, a name and date line, each word as a row of letter blanks with its
hint, an A–Z strip for crossing off guessed letters, and the starting
picture. This means students can also play it on paper in pairs.

``:answers: print`` adds an answer key on a page of its own. It only
appears when you print, so the answers never show on screen.

.. code-block:: rst

   .. guessword::
      :image: snowman
      :title: States of matter
      :lives: 12
      :answers: print

      evaporation | Liquid to gas below the boiling point
      condensation | Gas to liquid
      melting point | Temperature where a solid becomes a liquid
      sublimation | Solid straight to gas

.. guessword::
   :image: snowman
   :title: States of matter
   :lives: 12
   :answers: print

   evaporation | Liquid to gas below the boiling point
   condensation | Gas to liquid
   melting point | Temperature where a solid becomes a liquid
   sublimation | Solid straight to gas

Colour themes
-------------

``:theme:`` sets the colours of the game. ``:image:`` still chooses the
picture, so the two can be mixed freely.

.. code-block:: rst

   .. guessword:: evaporation
      :image: beaker
      :theme: dark
      :hint: A liquid turning into a gas below its boiling point

   .. guessword:: chlorophyll
      :image: flower
      :theme: forest
      :hint: The green pigment in leaves

   .. guessword:: magnet
      :image: circuit
      :theme: contrast
      :hint: Attracts iron, nickel and cobalt

.. guessword:: evaporation
   :image: beaker
   :theme: dark
   :hint: A liquid turning into a gas below its boiling point

.. guessword:: chlorophyll
   :image: flower
   :theme: forest
   :hint: The green pigment in leaves

.. guessword:: magnet
   :image: circuit
   :theme: contrast
   :hint: Attracts iron, nickel and cobalt
