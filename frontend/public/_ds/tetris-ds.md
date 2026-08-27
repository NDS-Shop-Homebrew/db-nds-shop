---

  title:  Tetris DS,
  author:  Nintendo,
  developer:  ,
  publisher:  ,
  version:  (Europe) (En,Fr,De,Es,It),
  titleId:  ATRP,
  systems:  [
    DS
  ],
  genres:  [],
  categories:  [
    game
  ],
  color:  ,
  color_bg:  ,
  priority:  false,
  stars:  0,
  icon:  https: //db-nds-shop.fr/assets/images/icons/tetrisds.png,
  image:  ,
  boxart:  https: //db-nds-shop.fr/assets/boxarts/tetris-ds-front.png,
  downloads:  {
    Tetris DS (Europe) (En,Fr,De,Es,It).nds:  {
      url:  https: //db-nds-shop.fr/games/Tetris%20DS%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%29.nds,
      size:  null
    }
  },
  screenshots:  [
    {
      url:  https: //db-nds-shop.fr/assets/boxarts/tetris-ds-front.png,
      order:  0
    },
    {
      url:  https: //db-nds-shop.fr/assets/screenshots/tetris-ds-snap-1.png,
      order:  1
    }
  ],
  scripts:  [
    {
      type:  downloadFile,
      file:  https: //db-nds-shop.fr/assets/images/boxart/Tetris%20DS%20(Europe)%20(En%2CFr%2CDe%2CEs%2CIt).nds.png,
      output:  /_nds/TwiLightMenu/boxart/Tetris DS (Europe) (En,Fr,De,Es,It).nds.png
    },
    {
      type:  downloadFile,
      file:  https: //db-nds-shop.fr/games/Tetris%20DS%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%29.nds,
      output:  /roms/nds/Tetris DS (Europe) (En,Fr,De,Es,It).nds
    },
    {
      type:  downloadFile,
      file:  https: //db-nds-shop.fr/forwarder/Tetris%20DS%20(Europe)%20(En%2CFr%2CDe%2CEs%2CIt).cia,
      output:  /Tetris DS (Europe) (En,Fr,De,Es,It).cia
    },
    {
      type:  installCia,
      file:  /Tetris DS (Europe) (En,Fr,De,Es,It).cia,
      output:  null
    },
    {
      type:  deleteFile,
      file:  /Tetris DS (Europe) (En,Fr,De,Es,It).cia,
      output:  null
    }
  ]

---


