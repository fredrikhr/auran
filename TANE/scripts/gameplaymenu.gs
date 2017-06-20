// ============================================================================
// File: GameplayMenu.gs
// Desc: The TrainzScript base class for GameplayMenu assets.
// ============================================================================
include "Library.gs"
include "Constructors.gs"
include "GameplayMenuBase.gs"



// ============================================================================
// Name: GameplayMenu
// Desc: The TrainzScript base class for GameplayMenu assets.
// ============================================================================
game class GameplayMenu isclass GameplayMenuBase
{
  Browser     m_browser;
  
  public define int MENUMODE_NONE = 0;        // Not visible.
  public define int MENUMODE_BUTTON = 1;      // Visible as a button on the gameplay menu.
  public define int MENUMODE_MENU = 2;        // Visible as a full-screen menu.
  
  
  // ============================================================================
  // Name: SetGameplayMenuMode
  // Desc: Called whenever the menumode of this GameplayMenu is changed.
  // Parm: browser - The Browser control which is used to visualise this 
  //       GameplayMenu.
  // Parm: menuMode - One of the MENUMODE_* defines, indicating which mode we
  //       are switching to.
  // ============================================================================
  public void SetGameplayMenuMode(Browser browser, int menuMode)
  {
    m_browser = browser;
  }
  
  
  // ============================================================================
  // Name: CloseGameplayMenu
  // Desc: This function causes this gameplay menu to be closed, returning the
  //       user to the game main menu.
  // ============================================================================
  public native void CloseGameplayMenu(void);
  
  
  // ============================================================================
  // Name: UserRequestGoBack
  // Desc: Called whenever the user requests a "go back" action. If the user has
  //       navigated to some form of "sub menu", this should return them to the
  //       main level of this gameplay menu. If at the main level, this should
  //       close the gameplay menu and return to the game main menu.
  // ============================================================================
  public void UserRequestGoBack(void)
  {
    CloseGameplayMenu();
  }
  

  // ============================================================================
  // Name: TADRequestRefresh
  // Desc: Called on a fullscreen menu when the TAD is modified.
  //       Dynamic menus based on lists of assets may wish to refresh their
  //       view of the world at this time.
  // ============================================================================
  public void TADRequestRefresh(void)
  {
  }
};


