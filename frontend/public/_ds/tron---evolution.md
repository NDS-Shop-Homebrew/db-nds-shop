---

  title:  Tron - Evolution,
  author:  test,
  developer:  test,
  publisher:  test,
  version:  (Europe),
  titleId:  VTEE,
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
  icon:  https: //db-nds-shop.fr/assets/icons/tron-evolution.png,
  image:  ,
  boxart:  https: //db-nds-shop.fr/assets/boxarts/tron-evolution-front.png,
  downloads:  {
    TRON - Evolution (USA) (En,Fr,Es) (NDSi Enhanced).cia:  {
      url:  https: //db-nds-shop.fr/assets/roms/cia/TRON%20-%20Evolution%20(USA)%20(En%2CFr%2CEs)%20(NDSi%20Enhanced).cia,
      size:  195328
    },
    TRON - Evolution (USA) (En,Fr,Es) (NDSi Enhanced).nds:  {
      url:  https: //db-nds-shop.fr/api/v1/download/TRON%20-%20Evolution%20(USA)%20(En%2CFr%2CEs)%20(NDSi%20Enhanced).nds,
      size:  null
    }
  },
  screenshots:  [
    {
      url:  https: //db-nds-shop.fr/assets/boxarts/tron-evolution-front.png,
      order:  0
    },
    {
      url:  https: //db-nds-shop.fr/assets/screenshots/tron-evolution-snap-1.png,
      order:  1
    }
  ],
  scripts:  [
    {
      type:  downloadFile,
      file:  https: //db-nds-shop.fr/games/TRON%20-%20Evolution%20(USA)%20(En%2CFr%2CEs)%20(NDSi%20Enhanced).nds,
      output:  /roms/nds/TRON - Evolution (USA) (En,Fr,Es) (NDSi Enhanced).nds
    },
    {
      type:  downloadFile,
      file:  https: //db-nds-shop.fr/forwarder/TRON%20-%20Evolution%20(USA)%20(En%2CFr%2CEs)%20(NDSi%20Enhanced).cia,
      output:  /TRON - Evolution (USA) (En,Fr,Es) (NDSi Enhanced).cia
    },
    {
      type:  installCia,
      file:  /TRON - Evolution (USA) (En,Fr,Es) (NDSi Enhanced).cia,
      output:  null
    },
    {
      type:  deleteFile,
      file:  /TRON - Evolution (USA) (En,Fr,Es) (NDSi Enhanced).cia,
      output:  null
    }
  ]

---

test
