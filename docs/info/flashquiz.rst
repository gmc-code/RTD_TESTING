=========================
Flash Quiz
=========================

The ``flashquiz`` directive runs a timed question-and-answer slideshow.
Each question shows on its own, the answer fades in after a set time, and
then the next question appears. It is designed for quick-fire revision on
the classroom screen.

Writing a quiz
--------------

Put one question per line, with a ``|`` between the question and the answer.
Start a new section with a line beginning with ``#``. Each section gets its own
title slide and answer colour, and can be switched on or off in Settings.

.. code-block:: rst

   .. flashquiz:: Living Things & Ecosystems
      :question-time: 8
      :answer-time: 4
      :section-time: 3
      :loop:

      # 2A Introduction to Classification
      Sorting organisms into groups is called what? | Classification
      Groups are based on shared what? | Features

      # 2B How Biologists Classify Organisms
      What is the broadest classification level? | Kingdom

Options
-------

``:question-time:``
   Seconds the question shows before the answer appears. Default ``8``.

``:answer-time:``
   Seconds the answer shows before the next question. Default ``4``.

``:section-time:``
   Seconds each section title slide shows. ``0`` skips them. Default ``3``.

``:loop:``
   Start again from the first question after the last one.

``:shuffle:``
   Shuffle the questions within each section (reshuffled on every loop).

``:autostart:``
   Start playing as soon as the page loads.

``:timer-bar:``
   ``on`` or ``off``. Shows or hides the bar that fills up as the time runs out.
   Default ``on``.

``:review:``
   ``on`` or ``off``. When ``on``, the round after a loop plays only the
   questions tagged for review (see below). Default ``on``.

``:theme:``
   ``dark``, ``light`` or ``auto``. ``auto`` follows the computer's light or
   dark setting. Default ``dark``. Viewers can also pick a theme in ⚙ Settings;
   their choice is remembered in that browser and applies to every quiz.

All of these can also be changed on the page with the ⚙ Settings button.

Controls
--------

* **Space** – play / pause
* **Right arrow** or click the slide – show the answer, then the next question
* **Left arrow** – back

The ◀◀ and ▶▶ buttons (and the arrow keys) also take modifier keys:

=====================  =========================================  ====================================================
Modifier               ◀◀ / Left arrow                            ▶▶ / Right arrow
=====================  =========================================  ====================================================
**Shift** (or          Start of this section; press again for     Next section
long-press)            the previous section
**Alt**                Replay this question from the start        Next question, without showing this answer
**Ctrl**               First question                             Last question
=====================  =========================================  ====================================================

Long-press works on touchscreens and interactive whiteboards. Hover over
◀◀ or ▶▶ to see these as a tooltip.

* **F** – full screen (the toolbar hides when the mouse is still)
* **R** – restart
* **#** button – opens a grid of numbered buttons; click a number to jump to that question

Tagging questions for review
----------------------------

Tag any question the class found hard, and the next loop plays only those:

* Press **T**, click the **⚑** button in the toolbar, or click the faint **⚑**
  next to the question number. A tagged question shows a red flag.
* When the quiz loops, a **Review round** slide appears and only the tagged
  questions play. Untag any the class now knows; the rest carry on to the next
  round. When nothing is left tagged, the full quiz plays again.
* With ``:loop:`` off, the end screen has a **Review … tagged** button.
* Tagged questions are marked with a flag in the **#** grid.
* ⚙ Settings shows how many are tagged, has **Clear tags**, and a
  **Next loop: only tagged questions** checkbox.

Tags are remembered in the browser you tagged them in, so you can tag in one
lesson and review in the next; use **Clear tags** to start fresh. Each quiz on
a page keeps its own tags. (They don't carry over to another computer or
browser, and a private window forgets them when it closes.)

In a review round each question keeps its number from the full quiz, so
question 40 still shows as 40.

Printing the page lists every question with its answer.

Example: Living Things & Ecosystems
-----------------------------------

.. flashquiz:: Living Things & Ecosystems
   :question-time: 8
   :answer-time: 4
   :section-time: 3
   :loop:

   # 2A Introduction to Classification
   Sorting organisms into groups by shared features is called what? | Classification
   Studying, grouping and naming organisms is called what? | Taxonomy
   Scientists who classify organisms are called what? | Taxonomists
   Scientists check each new species for unique what? | Traits
   A new species joins an existing group or a what? | New group
   Scientists first find similarities and what? | Differences
   Next, scientists look at potential what? | Categories
   Finally, scientists choose the best what? | Group
   Grouping helps scientists understand each species' survival what? | Needs
   Grouping shows how closely organisms are what? | Related
   Classification helps identify and protect which species? | Endangered

   # 2B How Biologists Classify Organisms
   How many life processes do living things carry out? | Seven
   The life processes are remembered as what? | MRS GREN
   Moving parts of the body is called what? | Movement
   Which process releases energy from food? | Respiration
   Detecting and responding to changes is called what? | Sensitivity
   Increasing in size is called what? | Growth
   Creating offspring is called what? | Reproduction
   Removing waste from the body is called what? | Excretion
   Taking in food for energy and growth is called what? | Nutrition
   Objects that never meet all seven criteria are what? | Non-living
   Organisms that met the criteria in the past are what? | Dead
   Classification sorts living things into how many levels? | Seven
   What is the broadest classification level? | Kingdom
   What is the most specific classification level? | Species
   Which level comes between kingdom and class? | Phylum
   A two-part scientific name is called a what? | Binomial name
   A binomial name uses the genus and the what? | Species
   Binomial names are always written in what? | Italics
   Which part of a binomial name starts with a capital? | Genus
   The species name is written in what case? | Lowercase
   More shared levels means closer what? | Relatedness
   Close relatives share a recent common what? | Ancestor
   Besides traits, what else shows how species relate? | Internal structures
   Humans are closely related to which ape? | Bonobos
   Which marsupial is distantly related to humans? | Kangaroos

   # 2C Keys for Classification
   Scientists look closely at physical what? | Characteristics
   Characteristics include size, shape, colour and what? | Patterns
   Shared features can make identification what? | Difficult
   Keys highlight subtle what between species? | Differences
   A key is a series of statements or what? | Questions
   Can keys identify non-living things? | Yes
   Keys help us understand an organism's what? | Role
   Which key gives exactly two options each step? | Dichotomous
   A leaf edge with teeth is described as what? | Serrated
   Which key gives more than two options each step? | Polytomous
   Polytomous keys suit which identification tasks? | Complex
   Which key uses a tree-like design? | Branching
   Which key starts at the centre and moves outwards? | Circular
   Which key presents questions in a numbered table? | Tabular

   # 2D Discovering the Kingdoms
   Who began early taxonomy over 2000 years ago? | Aristotle
   Who expanded the classification system in the 1700s? | Linnaeus
   Early taxonomy only included which organisms? | Visible
   In which century were microscopes invented? | 1600s
   Microscopes revealed microscopic life and what? | Cells
   Animals get nutrition by eating other what? | Organisms
   Animals without a backbone are called what? | Invertebrates
   Animals with a backbone are called what? | Vertebrates
   Vertebrates belong to which phylum? | Chordata
   Vertebrates are traditionally grouped into how many classes? | Five
   Mammals, reptiles, fish, amphibians and what? | Birds
   Which egg-laying mammal is tricky to classify? | Platypus
   Comparing which material reveals hidden similarities? | DNA
   Plants make their own food from what? | Sunlight
   Flowering plants with fruit-covered seeds are called what? | Angiosperms
   Plants that produce seeds on cones are called what? | Gymnosperms
   Flowering plants rely on what to make seeds? | Pollination
   Ferns and mosses reproduce using what? | Spores
   Which kingdom was created for part-plant, part-animal microbes? | Protista
   Protists include algae, slime moulds and what? | Protozoa
   Which protist makes food from sunlight but also moves and feeds? | Euglena
   Fungi were first classified as what? | Plants
   Do fungi use sunlight for energy? | No
   Fungi absorb nutrients from what kind of matter? | Decaying
   Tiny, single-celled fungi are called what? | Yeasts
   Name a multicellular fungus. | Mushroom
   Mushrooms must be identified to which level before eating? | Species
   Microscopes showed that bacteria lack a what? | Nucleus
   Which kingdom were bacteria first placed in? | Monera
   Monera's two branches are Bacteria and what? | Archaea
   Which organisms often thrive in hot springs? | Archaea
   How many domains of life are there? | Three
   Bacteria, Archaea and which other domain? | Eukarya

   # 3A Nature's Pantry
   Every organism lives within a what? | Ecosystem
   Ecosystems contain living and what elements? | Non-living
   Freshwater and marine habitats are which ecosystem type? | Aquatic
   Deserts, jungles and grasslands are which ecosystem type? | Terrestrial
   Living parts of an ecosystem are which factors? | Biotic
   Are bacteria a biotic or abiotic factor? | Biotic
   Non-living parts of an ecosystem are which factors? | Abiotic
   Is sunlight a biotic or abiotic factor? | Abiotic
   Producers that make food using sunlight are called what? | Autotrophs
   Making food from sunlight is called what? | Photosynthesis
   Consumers that eat other organisms are called what? | Heterotrophs
   Animals that eat only plants are called what? | Herbivores
   Animals that eat only meat are called what? | Carnivores
   Animals that eat plants and meat are called what? | Omnivores
   What breaks down dead matter and waste? | Decomposers
   Organisms compete when resources are what? | Limited
   Food, water, light, space and what? | Mates
   Does competition harm one or both competitors? | Both
   Competitors must use extra what? | Energy
   Predators and prey keep populations what? | Balanced
   Besides abiotic changes, what affects prey survival? | Predator numbers

   # 3B Food Chains and Food Webs
   A food chain shows who does what to who? | Eats
   A food chain shows how many energy pathways? | One
   Every food chain begins with a what? | Producer
   Producers capture sunlight to make what? | Sugar
   Each step in a food chain is called a what? | Trophic level
   The animal at the top of a food chain is the what? | Apex predator
   Is energy gained or lost at each trophic level? | Lost
   Energy is used for life processes or lost as what? | Heat
   What else removes energy from the chain? | Waste
   About what percentage passes to the next level? | 10%
   Which diagram shows energy reducing up the levels? | Trophic pyramid
   Do higher levels usually support more or fewer organisms? | Fewer
   Many interconnected food chains form a what? | Food web
   Which species keep ecosystems stable? | Keystone
   Keystone changes can trigger a trophic what? | Cascade
   A trophic cascade unbalances predators, prey and what? | Producers

   # 3C The Role of Microorganisms
   Organisms too small to see without a microscope are what? | Microorganisms
   Microorganisms are also called what? | Microbes
   Microbes come from how many main kingdoms? | Three
   Monera, Protista and which other kingdom? | Fungi
   Microbes can be producers, consumers or what? | Decomposers
   Phytoplankton and green algae are primary what? | Producers
   What forms the base of aquatic pyramids? | Phytoplankton
   Microbial consumers eat other what? | Microorganisms
   Microbes usually occupy which trophic levels? | Lower
   Microbes inside animals help them do what? | Digest food
   The two main decomposers are fungi and what? | Bacteria
   Dead matter and waste is called what? | Detritus
   Do decomposers digest inside or outside their bodies? | Outside
   Decomposers then absorb the released what? | Nutrients
   Decomposers return minerals to soil and what? | Water
   Without decomposers, organic waste would do what? | Pile up
   Piled-up waste would block sunlight and what? | Air
   Without decomposers, ecosystems would do what? | Collapse

   # 3D Changes to Ecosystems and Populations
   Plants take in which gas? | Carbon dioxide
   Plants release which gas? | Oxygen
   Plants feed which level of consumers? | Primary
   Trees provide what for many organisms? | Shelter
   Tree roots reduce soil what? | Erosion
   Decomposing trees replenish what in soil? | Nutrients
   Name an abiotic factor that changes with seasons. | Temperature
   Seasons also change the availability of what? | Water
   Population sizes rise and do what regularly? | Fall
   Seasonal movement between regions is called what? | Migration
   Dormancy caused by extreme cold is called what? | Hibernation
   Dormancy caused by extreme heat is called what? | Aestivation
   Besides migration, what timing helps organisms survive seasons? | Reproductive timing
   Pollinators and top predators stabilise what? | Food webs
   Losing pollinators prevents plant what? | Reproduction
   Losing top predators increases which numbers? | Prey
   Too many prey causes what? | Overgrazing
   Clearing forests for farming is called what? | Deforestation
   Deforestation destroys animal what? | Habitats
   Growing one crop repeatedly is called what? | Monoculture
   Heavy livestock cause soil what? | Compaction
   Compaction increases runoff and soil what? | Erosion
   Fertiliser runoff into water causes what? | Eutrophication
   Algal blooms block sunlight and deplete what? | Oxygen

   # 3E The Impact of Invasive Species
   Species moved by humans outside their natural area are called what? | Introduced
   Introduced species that spread and cause harm are what? | Invasive
   Species occurring naturally in a region are called what? | Native
   Invasive species outcompete native species for what? | Resources
   These resources include food, water and what? | Shelter
   Competition can cause local declines or what? | Extinctions
   Name a deliberate reason for introducing a species. | Farming
   Species arrive accidentally through cargo or what? | Ballast water
   Completely removing a species is called what? | Eradication
   Releasing a natural enemy to manage pests is called what? | Biological control
   Which predators affect many trophic levels? | Generalist
   Cane toad tadpoles eat what in water? | Algae
   Adult cane toads eat native what? | Insects
   Cane toad skin toxins poison native what? | Predators

Example: Energy & Circuits
--------------------------

.. flashquiz:: Energy & Circuits
   :question-time: 6
   :answer-time: 4
   :section-time: 3
   :loop:

   # 6A Forms of Energy
   Energy is the ability to make what? | Changes
   Energy can move objects or do what? | Work
   Which type of energy is stored energy? | Potential
   Potential energy depends on position or what? | State
   What is the energy of a moving object called? | Kinetic
   The energy of moving particles is which energy? | Thermal
   How do particles in hotter objects move? | Faster
   Chemical energy is stored in chemical what? | Bonds
   Food, fuel and batteries store which energy? | Chemical
   Raised objects store which potential energy? | Gravitational
   Stretched or squeezed materials store which energy? | Elastic
   Name a stretchy object that stores elastic energy. | Rubber band
   Sound energy is carried by vibrating what? | Particles
   Sound travels through the air to which body part? | Ears
   Moving charged particles carry which energy? | Electrical
   Energy carried by electromagnetic waves is called what? | Radiant
   Which visible energy can travel through empty space? | Light
   Nuclear energy comes from splitting or combining what? | Nuclei
   The energy of moving machine parts is called what? | Mechanical

   # 6B Energy Transfers & Transformations
   Energy cannot be created or what? | Destroyed
   This is the law of what of energy? | Conservation
   Energy can only be transferred or what? | Transformed
   Energy moving between objects in the same form is a what? | Transfer
   Energy changing into another form is a what? | Transformation
   Transformations often happen inside a what? | Device
   Flow diagrams use what to show energy changes? | Arrows
   Hairdryers transform electrical energy mainly into which energy? | Thermal
   Hairdryers also produce kinetic and which energy? | Sound
   Phone batteries turn chemical energy into which energy? | Electrical
   Which diagram shows useful and wasted energy? | Sankey
   In a Sankey diagram, what shows the amount of energy? | Arrow width
   Total input energy always equals total ___ energy. | Output

   # 6C Waste Energy
   Extra, usually unwanted, forms of energy are called what? | By-products
   By-products form during transfers or what? | Transformations
   The energy going into a device is called what? | Input
   The energy coming out of a device is called what? | Output
   Output energy that we need is called what? | Useful
   Output energy that we don't use is called what? | Waste
   Waste energy is usually thermal energy, light or what? | Sound
   Devices that turn most input energy into useful energy are what? | Efficient
   How much energy do efficient devices waste? | Very little
   Heat transfer through direct particle contact? | Conduction
   Conduction works best in which state of matter? | Solids
   Heat transfer through moving liquids or gases? | Convection
   Heat transfer through electromagnetic waves? | Radiation
   Which heat transfer can cross empty space? | Radiation

   # 6D Everyday Energy Efficiency
   Which labels show appliance efficiency? | Energy Rating
   More stars means a more what appliance? | Efficient
   Labels help compare similar appliance what? | Models
   Yearly electricity use is measured in what unit? | Kilowatt-hours
   The rate a device transforms energy is called what? | Power
   Power is measured in what unit? | Watts
   One watt equals one what per second? | Joule
   Running cost = energy used × what? | Unit price
   Name an efficient lighting technology. | LED
   What reduces heat flow into or out of appliances? | Insulation
   Which home design uses sunlight and airflow? | Passive solar
   In Australia, passive solar windows face which way? | North
   Name one thermal mass material. | Concrete
   Thermal mass releases absorbed heat how? | Slowly
   Which inspection identifies wasted energy? | Energy audit

   # 7A Electric Circuits
   Which circuit has one single pathway? | Series
   In series, current flows through each component in what? | Turn
   Which circuit splits into several branches? | Parallel
   In parallel, each component has its own what? | Branch
   Opening a switch in series turns off how many bulbs? | All
   In parallel, if one branch is off, the others do what? | Keep working
   In which circuit is current the same throughout? | Series
   Series components share the total what? | Voltage
   Each parallel branch gets the full battery what? | Voltage
   Which circuit type do houses use? | Parallel
   Which device cuts power during short circuits? | Circuit breaker
   Circuit breakers prevent overheating and what? | Fires
   Which device protects people from electric shock? | Safety switch

   # 7B Series and Parallel Circuits
   Current only flows in what type of circuit? | Closed
   Materials that let current flow easily are called what? | Conductors
   A simple circuit has a power supply, a switch and a what? | Load
   What joins the parts of a circuit together? | Wires
   Batteries provide the electrical push called what? | Voltage
   Voltage is measured in what unit? | Volts
   Which meter measures voltage? | Voltmeter
   Are voltmeters connected in series or parallel? | Parallel
   The flow of electric charge is called what? | Current
   Current is measured in what unit? | Amps
   Which meter measures current? | Ammeter
   Are ammeters connected in series or parallel? | Series
   What reduces the current in a circuit? | Resistance
   Opening a switch does what to the current? | Stops it
   Which tool measures voltage, current and resistance? | Multimeter

   # 7C Applications of Electric Circuits
   Devices that detect changes in the environment? | Sensors
   Sensors turn changes into electrical what? | Signals
   Which sensors detect objects without touching? | Proximity
   Ultrasonic sensors send out sound and time the what? | Echo
   Self-driving cars use which sensors for distance? | Ultrasonic
   Automatic taps send out which invisible beam? | Infrared
   Security systems detect infrared from what? | Body heat
   What is a temperature-sensitive resistor called? | Thermistor
   Central heating uses which component? | Thermistor
   What is a light-sensitive resistor called? | Photoresistor
   A photoresistor's resistance rises in the what? | Dark
   Street lights use which component? | Photoresistor
   A complete pathway for current is an electric what? | Circuit
