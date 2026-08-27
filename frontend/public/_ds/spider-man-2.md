---

  title:  Spider-Man 2,
  author:  test,
  developer:  test,
  publisher:  test,
  version:  (Europe),
  titleId:  AS2E,
  systems:  [
    DS
  ],
  genres:  [
    test
  ],
  categories:  [
    game
  ],
  color:  ,
  color_bg:  ,
  priority:  false,
  stars:  0,
  icon:  https: //db-nds-shop.fr/assets/icons/spider-man-2.png,
  image:  ,
  boxart:  https: //db-nds-shop.fr/assets/boxarts/spider-man-2-front.png,
  downloads:  {
    Spider-Man 2 (USA).nds:  {
      url:  https: //db-nds-shop.fr/api/v1/download/Spider-Man%202%20(USA).nds,
      size:  null
    }
  },
  screenshots:  [
    {
      url:  https: //db-nds-shop.fr/assets/boxarts/spider-man-2-front.png,
      order:  0
    },
    {
      url:  https: //db-nds-shop.fr/assets/screenshots/spider-man-2-snap-1.png,
      order:  1
    }
  ],
  scripts:  [
    {
      type:  downloadFile,
      file:  https: //db-nds-shop.fr/games/Spider-Man%202%20(USA).nds,
      output:  /roms/nds/Spider-Man 2 (USA).nds
    },
    {
      type:  downloadFile,
      file:  https: //db-nds-shop.fr/forwarder/Spider-Man%202%20(USA).cia,
      output:  /Spider-Man 2 (USA).cia
    },
    {
      type:  installCia,
      file:  /Spider-Man 2 (USA).cia,
      output:  null
    },
    {
      type:  deleteFile,
      file:  /Spider-Man 2 (USA).cia,
      output:  null
    }
  ]

---


