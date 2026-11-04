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
      :question-time: 5
      :answer-time: 3
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
   Seconds the question shows before the answer appears. Default ``5``.

``:answer-time:``
   Seconds the answer shows before the next question. Default ``3``.

``:section-time:``
   Seconds each section title slide shows. ``0`` skips them. Default ``3``.

``:loop:``
   Start again from the first question after the last one.

``:shuffle:``
   Shuffle the questions within each section (reshuffled on every loop).

``:autostart:``
   Start playing as soon as the page loads.

All of these can also be changed on the page with the ⚙ Settings button.

Controls
--------

* **Space** – play / pause
* **Right arrow** or click the slide – show the answer, then the next question
* **Left arrow** – back
* **F** – full screen (the toolbar hides when the mouse is still)
* **R** – restart

Printing the page lists every question with its answer.

Example: Living Things & Ecosystems
-----------------------------------

.. flashquiz:: Living Things & Ecosystems
   :question-time: 5
   :answer-time: 3
   :section-time: 3
   :loop:

   # 2A Introduction to Classification
   Sorting organisms into groups is called what? | Classification
   Groups are based on shared what? | Features
   Studying, grouping and naming organisms is called what? | Taxonomy
   Scientists who classify organisms are called what? | Taxonomists
   New species are checked for unique what? | Traits
   New species join existing groups or what? | New groups
   Scientists first find similarities and what? | Differences
   Next, scientists look at potential what? | Categories
   Finally, scientists choose the best what? | Group
   Grouping helps us understand survival what? | Needs
   Grouping shows how closely organisms are what? | Related
   Classification helps identify which species? | Endangered
   Once identified, endangered species can be what? | Protected

   # 2B How Biologists Classify Organisms
   How many life processes do living things carry out? | Seven
   The life processes are remembered as what? | MRS GREN
   Moving parts of the body is called what? | Movement
   Which process releases energy from food? | Respiration
   Detecting and responding to changes is called what? | Sensitivity
   Increasing in size is called what? | Growth
   Creating offspring is called what? | Reproduction
   Removing waste from the body is called what? | Excretion
   Food materials an organism takes in are called what? | Nutrients
   Objects that never meet all seven criteria are what? | Non-living
   Organisms that met the criteria in the past are what? | Dead
   Classification sorts living things into how many levels? | Seven
   What is the broadest classification level? | Kingdom
   What is the most specific classification level? | Species
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
   Characteristics include size, shape, color and what? | Patterns
   Shared features can make identification what? | Difficult
   Keys highlight subtle what between species? | Differences
   A key is a series of what? | Statements
   Can keys identify non-living things? | Yes
   Keys help us understand an organism's what? | Role
   Which key gives exactly two options each step? | Dichotomous
   Which key gives more than two options each step? | Polytomous
   Polytomous keys suit which identification tasks? | Complex
   Which key uses a tree-like design? | Branching
   Which key starts at the center and moves outwards? | Circular
   Which key presents questions in a numbered table? | Tabular

   # 2D Discovering the Kingdoms
   Who began early taxonomy long ago? | Aristotle
   Who later expanded the classification system? | Linnaeus
   Early taxonomy only included which organisms? | Visible
   In which century were microscopes invented? | 1600s
   Microscopes revealed microscopic life and what? | Cells
   Animals get nutrition by eating other what? | Organisms
   Animals without a backbone are called what? | Invertebrates
   Animals with a backbone are called what? | Vertebrates
   Vertebrates belong to which phylum? | Chordata
   How many classes of vertebrates are there? | Five
   Mammals, reptiles, fish, amphibians and what? | Birds
   Which egg-laying mammal is tricky to classify? | Platypus
   What reveals deeper cellular similarities? | Genetic material
   Plants make their own food from what? | Sunlight
   Flowering plants with fruit-covered seeds are called what? | Angiosperms
   Plants that produce seeds on cones are called what? | Gymnosperms
   Ferns and mosses reproduce using what? | Spores
   Which kingdom was created for part-plant, part-animal microbes? | Protista
   Protists include algae, slime moulds and what? | Protozoa
   Which protist uses sunlight but also moves and eats? | Euglena
   Fungi were first classified as what? | Plants
   Do fungi use sunlight for energy? | No
   Fungi absorb nutrients from what kind of matter? | Decaying
   Tiny, single-celled fungi are called what? | Yeasts
   Name a multicellular fungus. | Mushroom
   Mushrooms need identification to which level? | Genus
   Microscopes showed that bacteria lack a what? | Nucleus
   Which kingdom were bacteria first placed in? | Monera
   Monera's two branches are Bacteria and what? | Archaea
   Which organisms thrive in hot springs? | Archaea
   How many domains of life are there? | Three
   Bacteria, Archaea and which other domain? | Eukarya

   # 3A Nature's Pantry
   Every organism lives within a what? | Ecosystem
   Ecosystems contain living and what elements? | Non-living
   Freshwater and marine habitats are which ecosystem type? | Aquatic
   Desert, jungle and tundra are which ecosystem type? | Terrestrial
   Living parts of an ecosystem are which factors? | Biotic
   Non-living parts of an ecosystem are which factors? | Abiotic
   Is sunlight a biotic or abiotic factor? | Abiotic
   Are bacteria a biotic or abiotic factor? | Biotic
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
   Energy is used up or lost as what? | Heat
   What else removes energy from the chain? | Waste
   About what percentage passes to the next level? | 10%
   Which diagram shows energy reducing up the levels? | Trophic pyramid
   Do higher levels support more or fewer organisms? | Fewer
   Many interconnected food chains form a what? | Food web
   Which species keep ecosystems stable? | Keystone
   Keystone changes can trigger a trophic what? | Cascade

   # 3C The Role of Microorganisms
   Organisms too small to see unaided are called what? | Microorganisms
   Microorganisms are also called what? | Microbes
   Microbes come from how many main kingdoms? | Three
   Monera, Protista and which other kingdom? | Fungi
   Microbes can be producers, consumers or what? | Decomposers
   Phytoplankton and green algae are primary what? | Producers
   What forms the base of aquatic pyramids? | Phytoplankton
   Microbial consumers eat other what? | Microorganisms
   Microbes usually occupy which trophic levels? | Lower
   Many microbes live inside animals to aid what? | Digestion
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
   Pollinators and top predators stabilize what? | Food webs
   Losing pollinators prevents plant what? | Reproduction
   Losing top predators increases which numbers? | Prey
   Too many prey causes what? | Overgrazing
   Clearing forests for farming is called what? | Deforestation
   Deforestation destroys animal what? | Habitats
   Growing one crop repeatedly is called what? | Monoculture
   Heavy livestock cause soil what? | Compaction
   Compaction increases runoff and soil what? | Erosion
   Fertilizer runoff into water causes what? | Eutrophication
   Algal blooms block sunlight and deplete what? | Oxygen

   # 3E The Impact of Invasive Species
   Species taken outside their natural area are called what? | Introduced
   Introduced species that spread and cause harm are what? | Invasive
   Species occurring naturally in a region are called what? | Native
   Invasive species outcompete native species for what? | Resources
   Competition can cause local declines or what? | Extinctions
   Name a deliberate reason for introducing a species. | Farming
   Species arrive accidentally through cargo or what? | Ballast water
   Completely removing a species is called what? | Eradication
   Releasing a natural enemy to manage pests is called what? | Biological control
   Which predators affect many trophic levels? | Generalist
   Cane toad tadpoles affect what in water? | Algae
   Adult cane toads eat native what? | Insects
   Cane toad skin toxins poison native what? | Predators


Example: Energy & Circuits
--------------------------

.. flashquiz:: Energy & Circuits
   :question-time: 5
   :answer-time: 5
   :section-time: 3
   :loop:

   # 6A Forms of Energy
   Energy is the ability to make what? | Changes
   Energy can move objects or do what? | Work
   Which type of energy is stored energy? | Potential
   Potential energy depends on position or what? | State
   What is the energy of motion called? | Kinetic
   Moving particles in hot objects have which energy? | Thermal
   Chemical energy is stored in what? | Bonds
   Food, fuel and batteries store which energy? | Chemical
   Raised objects store which energy? | Gravitational
   Stretched or squeezed materials store which energy? | Elastic
   Name a stretchy object that stores elastic energy. | Rubber band
   Sound energy travels through vibrating what? | Air particles
   Sound travels through air to which body part? | Ears

   # 6B Energy Transfers & Transformations
   Energy cannot be destroyed. This is called the ___ of energy. | Conservation
   Can energy be created from nothing? | No
   Energy moving between objects is called a what? | Transfer
   Does energy change form during a transfer? | No
   Energy changing into another form is called a what? | Transformation
   Do transformations happen inside or between objects? | Inside
   Flow diagrams use what to show energy changes? | Arrows
   Hairdryers transform electrical energy mainly into what? | Heat
   Hairdryers also produce kinetic and which energy? | Sound
   Phone batteries turn chemical energy into which energy? | Electrical
   Which diagram shows useful and wasted energy? | Sankey
   Total input energy always equals total ___ energy. | Output

   # 6C Waste Energy
   Secondary forms of energy are called energy what? | By-products
   By-products form during transfers or what? | Transformations
   The energy going in is called what? | Input
   The energy coming out is called what? | Output
   Output energy that we need is called what? | Useful
   Output energy that we don't use is called what? | Waste
   Waste energy is usually heat, light or what? | Sound
   Devices that maximise useful output are called what? | Efficient
   Efficient devices create very little what? | Waste
   Heat transfer through direct particle contact? | Conduction
   Can conduction occur in gases? | Yes
   Heat transfer through moving liquids or gases? | Convection
   Heat transfer through electromagnetic waves? | Radiation

   # 6D Everyday Energy Efficiency
   Which labels show appliance efficiency? | Energy star
   Star labels compare similar appliance what? | Models
   Yearly energy use is measured in what unit? | Kilowatt-hours
   Kilowatt-hours show total yearly use of what? | Electricity
   The rate a device transforms energy is called what? | Power
   Power is measured in what unit? | Watts
   Running cost = energy used × what? | Unit cost
   Modern appliances use newer what? | Technologies
   What reduces appliance energy waste by trapping heat? | Insulation
   Which home design uses sunlight and airflow? | Passive solar
   Passive solar design warms and ___ homes. | Cools
   Name one thermal mass material. | Concrete
   Thermal mass releases absorbed heat how? | Slowly
   Which inspection identifies wasted energy? | Energy audit

   # 7A Electric Circuits
   Which circuit has one single pathway? | Series
   In series, current flows through each component in what? | Turn
   Which circuit branches into multiple pathways? | Parallel
   In parallel, each component has its own what? | Loop
   Switching off a series circuit stops how many bulbs? | All
   In parallel, if one branch is off, the others do what? | Keep working
   In which circuit is current the same throughout? | Series
   Series components share the total what? | Voltage
   Each parallel branch gets the full battery what? | Voltage
   Which circuit type do houses use? | Parallel
   Which device cuts power during short circuits? | Circuit breaker
   Circuit breakers prevent fires and electric what? | Shock

   # 7B Series and Parallel Circuits
   Electricity needs what type of circuit to flow? | Closed
   The circuit path must be what? | Unbroken
   Materials that let current flow easily are called what? | Conductors
   A simple circuit has a power supply and a what? | Load
   What joins the parts of a circuit together? | Wires
   What provides voltage and current for a circuit? | Battery
   The electrical push moving energy is called what? | Voltage
   Voltmeters measure voltage in what unit? | Volts
   The flow of electric charge is called what? | Current
   Ammeters measure current in what unit? | Amps
   What opposes or slows electric current? | Resistance
   Opening a switch breaks the circuit what? | Loop
   When the loop breaks, what happens to current? | Stops

   # 7C Applications of Electric Circuits
   Devices that detect changes in the environment? | Sensors
   Sensors convert changes into electrical what? | Signals
   Which sensors detect objects without touching? | Proximity
   Proximity sensors detect presence, absence or what? | Distance
   Ultrasonic sensors emit high-frequency what? | Sound waves
   Self-driving cars use which sensors for distance? | Ultrasonic
   Infrared sensors emit a beam of what? | Light
   Automatic taps use which type of sensor? | Infrared
   What is a temperature-sensitive resistor called? | Thermistor
   Central heating uses which component? | Thermistor
   What is a light-sensitive resistor called? | Photoresistor
   Street lights use which component? | Photoresistor
   Street lights switch on automatically when it is what? | Dark
