=======================================
Stringybark Food Chains with Questions
=======================================

These activities put a food chain and questions about it in one block,
using the ``activitygroup`` directive. The first directive in the group is
the food chain (``imagesequence``) and the directives after it are the
questions (``gapfill`` and ``multichoice``).

The questions are locked until the food chain is finished. The **Print
activity and questions** button prints the food chain and its questions
together.

Questions unlock when the chain is correct
==========================================

``:reveal: check`` keeps the questions locked until every picture is in the
right box and **Check** is pressed. **Answer** does not unlock them.

.. code-block:: rst

   .. activitygroup::
      :title: Grass to quoll
      :reveal: check

      .. imagesequence:: Grass to quoll
         :columns: 4
         :arrows: right
         :theme: forest

         .. step:: Stringybark_forest/Native_grass.png
            :label: Producer

            **Native grass** makes its own food from sunlight

         .. step:: Stringybark_forest/Snail.png
            :label: 1st consumer

            **Snail** eats grass

         .. step:: Stringybark_forest/Magpie.png
            :label: 2nd consumer

            **Magpie** eats snails

         .. step:: Stringybark_forest/Quoll.png
            :label: 3rd consumer

            **Quoll** eats magpies

      .. gapfill::
         :instructions: Complete the sentences about this food chain.

         The producer in this food chain is the @@native grass | snail | magpie | quoll@@.
         The snail is a @@herbivore | carnivore | producer@@ because it eats only plants.
         The top consumer in this food chain is the @@quoll | magpie | snail | native grass@@.
         Each arrow shows the direction that @@energy | sunlight | water@@ moves along the food chain.

      .. multichoice::

         In this food chain, what is the magpie?

         [x] 2nd consumer | Correct. The magpie eats the snail, which is the 1st consumer.
         [ ] 1st consumer | Incorrect. The 1st consumer eats the producer. That is the snail.
         [ ] Producer | Incorrect. The producer is the native grass.
         [ ] 3rd consumer | Incorrect. The 3rd consumer is the quoll.

      .. multichoice::

         In this food chain, what is most likely to happen to the magpies if all the snails die?

         [x] There will be fewer magpies because they have less food. | Correct.
         [ ] There will be more magpies because nothing eats them. | Incorrect. Quolls still eat magpies, and the magpies have lost their food.
         [ ] Nothing will change. | Incorrect. In this food chain the magpies eat the snails.

.. activitygroup::
   :title: Grass to quoll
   :reveal: check

   .. imagesequence:: Grass to quoll
      :columns: 4
      :arrows: right
      :theme: forest

      .. step:: Stringybark_forest/Native_grass.png
         :label: Producer

         **Native grass** makes its own food from sunlight

      .. step:: Stringybark_forest/Snail.png
         :label: 1st consumer

         **Snail** eats grass

      .. step:: Stringybark_forest/Magpie.png
         :label: 2nd consumer

         **Magpie** eats snails

      .. step:: Stringybark_forest/Quoll.png
         :label: 3rd consumer

         **Quoll** eats magpies

   .. gapfill::
      :instructions: Complete the sentences about this food chain.

      The producer in this food chain is the @@native grass | snail | magpie | quoll@@.
      The snail is a @@herbivore | carnivore | producer@@ because it eats only plants.
      The top consumer in this food chain is the @@quoll | magpie | snail | native grass@@.
      Each arrow shows the direction that @@energy | sunlight | water@@ moves along the food chain.

   .. multichoice::

      In this food chain, what is the magpie?

      [x] 2nd consumer | Correct. The magpie eats the snail, which is the 1st consumer.
      [ ] 1st consumer | Incorrect. The 1st consumer eats the producer. That is the snail.
      [ ] Producer | Incorrect. The producer is the native grass.
      [ ] 3rd consumer | Incorrect. The 3rd consumer is the quoll.

   .. multichoice::

      In this food chain, what is most likely to happen to the magpies if all the snails die?

      [x] There will be fewer magpies because they have less food. | Correct.
      [ ] There will be more magpies because nothing eats them. | Incorrect. Quolls still eat magpies, and the magpies have lost their food.
      [ ] Nothing will change. | Incorrect. In this food chain the magpies eat the snails.

Questions unlock when the answer is shown
=========================================

``:reveal: answer`` also unlocks the questions when **Answer** is
pressed, so a student who is stuck can still go on. ``:questions-title:``
and ``:locked-message:`` change the wording.

.. code-block:: rst

   .. activitygroup::
      :title: Stringybark to eagle
      :reveal: answer
      :questions-title: Food chain questions
      :locked-message: Put the food chain in order first. The questions will then appear here.

      The plant is already in the first box.

      .. imagesequence:: Stringybark to eagle
         :fixed: 1
         :columns: 5
         :arrows: right
         :theme: forest

         .. step:: Stringybark_forest/Brown_stringybark.png

            Brown stringybark

         .. step:: Stringybark_forest/Termite.png

            Termite eats stringybark wood

         .. step:: Stringybark_forest/Skink.png

            Skink eats termites

         .. step:: Stringybark_forest/Brown_snake.png

            Brown snake eats skinks

         .. step:: Stringybark_forest/Wedge-tailed_eagle.png

            Wedge-tailed eagle eats brown snakes

      .. gapfill::
         :instructions: Write the food chain in words.

         Brown stringybark → @@termite | skink | brown snake@@ → skink → @@brown snake | termite | wedge-tailed eagle@@ → wedge-tailed eagle

      .. multichoice::

         How many consumers are in this food chain?

         [x] 4 | Correct. The termite, skink, brown snake and wedge-tailed eagle are all consumers.
         [ ] 5 | Incorrect. The brown stringybark is a producer, not a consumer.
         [ ] 3 | Incorrect. Count every organism after the plant.
         [ ] 1 | Incorrect. Every organism after the plant is a consumer.

      .. multichoice::

         Which organism is a herbivore in this food chain?

         [x] Termite | Correct. The termite eats stringybark wood.
         [ ] Skink | Incorrect. The skink eats termites, so it is a carnivore.
         [ ] Brown snake | Incorrect. The brown snake eats skinks, so it is a carnivore.
         [ ] Wedge-tailed eagle | Incorrect. The eagle eats brown snakes, so it is a carnivore.

.. activitygroup::
   :title: Stringybark to eagle
   :reveal: answer
   :questions-title: Food chain questions
   :locked-message: Put the food chain in order first. The questions will then appear here.

   The plant is already in the first box.

   .. imagesequence:: Stringybark to eagle
      :fixed: 1
      :columns: 5
      :arrows: right
      :theme: forest

      .. step:: Stringybark_forest/Brown_stringybark.png

         Brown stringybark

      .. step:: Stringybark_forest/Termite.png

         Termite eats stringybark wood

      .. step:: Stringybark_forest/Skink.png

         Skink eats termites

      .. step:: Stringybark_forest/Brown_snake.png

         Brown snake eats skinks

      .. step:: Stringybark_forest/Wedge-tailed_eagle.png

         Wedge-tailed eagle eats brown snakes

   .. gapfill::
      :instructions: Write the food chain in words.

      Brown stringybark → @@termite | skink | brown snake@@ → skink → @@brown snake | termite | wedge-tailed eagle@@ → wedge-tailed eagle

   .. multichoice::

      How many consumers are in this food chain?

      [x] 4 | Correct. The termite, skink, brown snake and wedge-tailed eagle are all consumers.
      [ ] 5 | Incorrect. The brown stringybark is a producer, not a consumer.
      [ ] 3 | Incorrect. Count every organism after the plant.
      [ ] 1 | Incorrect. Every organism after the plant is a consumer.

   .. multichoice::

      Which organism is a herbivore in this food chain?

      [x] Termite | Correct. The termite eats stringybark wood.
      [ ] Skink | Incorrect. The skink eats termites, so it is a carnivore.
      [ ] Brown snake | Incorrect. The brown snake eats skinks, so it is a carnivore.
      [ ] Wedge-tailed eagle | Incorrect. The eagle eats brown snakes, so it is a carnivore.
