var SEARCH_PAGE_SIZE = 50

var STRINGS = {
  lt: {
    '(search will be slower if unchecked)': '(paieška bus lėtesnė jeigu atžymėsite)',
    'More results': 'Tęsti paiešką',
    'No results.': 'Nieko nerasta.',
    'Reset': 'Grįžti',
    'Restrict search to subject': 'Ieškoti tik laiško temoje',
    'Search query': 'Paieškos tekstas',
    'Search results:': 'Paieškos rezultatai',
    'Search': 'Paieška',
    'Searched for:': 'Ieškota:',
    'Searched range:': 'Paieškos apimtis:',
  },
}

var Language = 'en'

function _(str) {
  if (STRINGS[Language] && STRINGS[Language][str]) {
    return STRINGS[Language][str]
  }
  return str
}

function search(query, searchInBody, start) {
  if (!start) {
    start = 0
  }
  var firstMessageDate = ''
  var lastMessageDate = ''
  var results = []
  var threads = GmailApp.search('in:all -in:sent -in:spam -in:trash', start, SEARCH_PAGE_SIZE)
  threads.forEach(function (thread) {
    var messages = thread.getMessages()

    messages.forEach(function (message) {
      var date = message.getDate().toISOString().slice(0, 10)
      var subject = message.getSubject()
      var found = subject.includes(query)
      if (!found && searchInBody) {
        found = message.getBody().includes(query)
      }
      if (found) {
        results.push({
          id: message.getId(),
          date: date,
          from: message.getFrom(),
          subject: subject,
        })
      }
      if (!firstMessageDate) {
        firstMessageDate = date
      }
      lastMessageDate = date
    })
  })
  return { firstMessageDate, lastMessageDate, results }
}

function searchResultsCallback(event) {
  params = (event.parameters && event.parameters.params) ? JSON.parse(event.parameters.params) : {}
  var searchResults = search(params.query, params.searchInBody, params.start)
  var card = getCardForSearchResults(params, searchResults)

  return actionResponse = CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build()
}

function searchFormCallback(event) {
  var card
  var params = {
    query: event.formInput.search_keyword,
    searchInBody: event.formInput.search_in_subject != 'on',
    start: 0,
  }

  if (params.query) {
    var searchResults = search(params.query, params.searchInBody, params.start)
    card = getCardForSearchResults(params, searchResults)
  }
  else {
    card = getCardForSearchForm()
  }

  return actionResponse = CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build()
}

function getCardForSearchResults(params, searchResults) {
  Language = Session.getActiveUserLocale()

  var query = params.query
  var showSearchFormAction = CardService.newAction().setFunctionName('searchFormCallback')
  var showSearchResultsAction = CardService.newAction().setFunctionName('searchResultsCallback')

  var card = CardService.newCardBuilder().setName("Search results")

  if (searchResults) {
    card.setHeader(
      CardService.newCardHeader()
        .setTitle(_('Searched for:') + query)
        .setSubtitle(_('Searched range:') + ` ${searchResults.lastMessageDate} - ${searchResults.firstMessageDate}`)
    )

    if (searchResults.results.length) {
      searchResults.results.forEach(function (result) {
        var decorated = CardService.newDecoratedText()
          .setOpenLink(CardService.newOpenLink().setUrl('https://mail.google.com/mail/u/0/#all/' + result.id))
          .setTopLabel(result.from)
          .setText(result.subject)
          .setBottomLabel(result.date)
          .setWrapText(true)

        card.addSection(CardService.newCardSection().addWidget(decorated))
      })
    }
    else {
      card.addSection(CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText(_('No results.'))
      ))
    }

    params.start = (params.start || 0) + SEARCH_PAGE_SIZE,

    card.setFixedFooter(
      CardService.newFixedFooter()
        .setSecondaryButton(CardService.newTextButton()
          .setText(_('Reset'))
          .setOnClickAction(showSearchFormAction)
        )
        .setPrimaryButton(CardService.newTextButton()
          .setText(_('More results'))
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setOnClickAction(showSearchResultsAction.setParameters({ params: JSON.stringify(params) }))
        )
    )
  }

  return card.build()
}

function getCardForSearchForm() {
  Language = Session.getActiveUserLocale()

  var showSearchFormAction = CardService.newAction().setFunctionName('searchFormCallback')

  var card = CardService.newCardBuilder().setName("Search")

  var section = CardService.newCardSection()
    .addWidget(
      CardService.newDecoratedText()
        .setText(_('Restrict search to subject'))
        .setSwitchControl(
          CardService.newSwitch()
            .setFieldName('search_in_subject')
            .setValue('on')
            .setSelected(true)
            .setControlType(CardService.SwitchControlType.CHECK_BOX)
        )
        .setBottomLabel(_('(search will be slower if unchecked)'))
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName('search_keyword')
        .setTitle(_('Search query'))
    )
    .addWidget(
      CardService.newTextButton()
        .setText(_('Search'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(showSearchFormAction)
    )

  card.addSection(section)
  return card.build()
}

function buildHomePage() {
  return getCardForSearchForm()
}
