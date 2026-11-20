========================
Christmas scene
========================

Click a picture to bring it to life. See :doc:`/christmas/christmas_info` for how to use it, and
:doc:`/christmas/christmas_tutorial` for the tutorial on making the GIFs in Photoshop.

.. christmas::
    :title: Christmas scene
    :background: christmas_images/background.png
    :folder: christmas_images
    :snow:
    :sound:

    star.gif | Star | x=50 y=14 width=16.5
    bauble.gif | Bauble | x=18 y=75 width=7
    bell.gif | Bell | x=27.7 y=75 width=8
    tree.gif | Christmas tree | x=22 y=58 width=20
    snowman.gif | Snowman | x=72 y=66 width=15
    present.gif | Present | x=37 y=82 width=10
    candle.gif | Candle | x=55.7 y=67.5 width=8
    gingerbread.gif | Gingerbread | x=89 y=80 width=10
    santa_sleigh.gif | Santa's sleigh | x=40 y=33 width=30 seconds=8 move=right
    shooting_star.gif | Shooting star | x=71.5 y=5.1 width=13 seconds=3 move=left
    elf_green.gif | Green elf | x=47 y=91 width=8 seconds=6 move=right
    elf_red.gif | Red elf | x=40 y=93 width=9.5 seconds=6.5 move=right
    penguin.gif | Penguin | x=75.6 y=95.5 width=7.5 seconds=6 move=left
    snowball.gif | Snowball | x=9.4 y=89.6 width=5 seconds=7 move=right

The sleigh, the shooting star, the elves, the penguin and the snowball have ``move=`` on
their lines, so they travel across the scene when they are clicked.

----

As a grid
---------------

Leave out ``:background:`` and the pictures are set out as cards. This one uses
``:play: toggle``, so a click starts a picture and another click stops it.

.. christmas::
   :title: Christmas cards
   :folder: christmas_images
   :columns: 4
   :play: toggle

   star.gif
   bell.gif
   bauble.gif
   present.gif
   candle.gif
   snowman.gif
   tree.gif | Christmas tree
   gingerbread.gif
   santa_sleigh.gif | Santa's sleigh
   elf_green.gif | Green elf
   elf_red.gif | Red elf
   penguin.gif
   snowball.gif
   shooting_star.gif | Shooting star
