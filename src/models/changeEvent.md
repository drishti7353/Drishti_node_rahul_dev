# Event System Changes - Frontend Implementation Guide

## 1. New Event Model Properties

Add these new properties to your Event model in Flutter:

I'll create a detailed Markdown file to document the changes that the frontend team needs to implement in Flutter.

### [changeEvent.md](file:///Users/rahultamatta/Documents/GitHub/Untitled/src/models/changeEvent.md)

```markdown
# Event System Changes - Frontend Implementation Guide

## 1. New Event Model Properties

Add these new properties to your Event model in Flutter:

```dart
class Event {
  // ...existing properties...
  
  bool recurring;
  RecurringPattern? recurringPattern;
  List<String> skippedDates;
  
  // Add this constructor parameter
  Event({
    // ...existing parameters...
    this.recurring = false,
    this.recurringPattern,
    this.skippedDates = const [],
  });
}

class RecurringPattern {
  final String frequency; // 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'
  final int interval;
  final int? count;
  final String? until;
  
  RecurringPattern({
    required this.frequency,
    this.interval = 1,
    this.count,
    this.until,
  });
}
```

## 2. UI Updates Required

### 2.1 Event Creation/Edit Screen

Add these new fields to your event form:

```dart
// Add a recurring switch
SwitchListTile(
  title: Text('Recurring Event'),
  value: _isRecurring,
  onChanged: (bool value) {
    setState(() {
      _isRecurring = value;
    });
  },
),

// Show recurring pattern fields if _isRecurring is true
if (_isRecurring) ...[
  DropdownButtonFormField<String>(
    value: _frequency,
    items: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']
        .map((f) => DropdownMenuItem(value: f, child: Text(f)))
        .toList(),
    onChanged: (value) => setState(() => _frequency = value),
    decoration: InputDecoration(labelText: 'Frequency'),
  ),
  
  TextFormField(
    controller: _intervalController,
    keyboardType: TextInputType.number,
    decoration: InputDecoration(
      labelText: 'Repeat every (n) frequency',
      hintText: 'e.g., 1 for every day, 2 for every other day',
    ),
  ),
  
  TextFormField(
    controller: _untilController,
    decoration: InputDecoration(labelText: 'Repeat Until (YYYY-MM-DD)'),
  ),
]
```

### 2.2 Event List Item

Update your event card/list item to show recurring information:

```dart
Widget buildEventCard(Event event) {
  return Card(
    child: Column(
      children: [
        // ...existing event details...
        
        if (event.recurring) ...[
          Row(
            children: [
              Icon(Icons.repeat),
              Text('Repeats ${event.recurringPattern!.frequency.toLowerCase()}'),
              if (event.recurringPattern!.interval > 1)
                Text('every ${event.recurringPattern!.interval} days'),
            ],
          ),
        ],
        
        // Show if event is skipped for current date
        if (event.skippedDates.contains(getCurrentDateString()))
          Text('Skipped for today', 
            style: TextStyle(color: Colors.red),
          ),
      ],
    ),
  );
}
```

## 3. API Integration

### 3.1 Event Creation/Update

Update your event creation/update service:

```dart
class EventService {
  Future<Event> createEvent(Event event) async {
    final response = await http.post(
      Uri.parse('$baseUrl/events/create'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        // ...existing event data...
        'recurring': event.recurring,
        if (event.recurring) 'recurringPattern': {
          'frequency': event.recurringPattern!.frequency,
          'interval': event.recurringPattern!.interval,
          'until': event.recurringPattern!.until,
        },
        'skippedDates': event.skippedDates,
      }),
    );
    // ... handle response
  }
}
```

### 3.2 Skip/Enable Event Occurrence

Add these methods to your event service:

```dart
class EventService {
  Future<void> skipEventOccurrence(String eventId, String date) async {
    await http.post(
      Uri.parse('$baseUrl/notifications/disable/$eventId'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'date': date}),
    );
  }

  Future<void> enableEventOccurrence(String eventId, String date) async {
    await http.post(
      Uri.parse('$baseUrl/notifications/enable/$eventId'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'date': date}),
    );
  }
}
```

## 4. Notification Handling

### 4.1 Update Event Subscription

When subscribing to events, handle recurring events appropriately:

```dart
class NotificationService {
  Future<void> subscribeToEvent(String eventId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/notifications/subscribe/$eventId'),
      headers: {'Content-Type': 'application/json'},
    );
    
    if (response.statusCode == 200) {
      // Update local event subscription status
      // Handle recurring notification schedule feedback
    }
  }
}
```

### 4.2 Display Notification Settings

Add a notification settings dialog for recurring events:

```dart
void showNotificationSettings(Event event) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Notification Settings'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Toggle for specific occurrence
          ListTile(
            title: Text('Skip Next Occurrence'),
            trailing: IconButton(
              icon: Icon(Icons.skip_next),
              onPressed: () {
                final nextDate = getNextOccurrence(event);
                eventService.skipEventOccurrence(
                  event.id, 
                  nextDate.toIso8601String()
                );
              },
            ),
          ),
          // Show skipped dates
          if (event.skippedDates.isNotEmpty) ...[
            Text('Skipped Dates:'),
            ...event.skippedDates.map((date) => 
              ListTile(
                title: Text(date),
                trailing: IconButton(
                  icon: Icon(Icons.restore),
                  onPressed: () => eventService.enableEventOccurrence(
                    event.id, 
                    date
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    ),
  );
}
```

## 5. Testing Points

1. Create recurring events with different patterns
2. Subscribe to recurring events
3. Skip specific occurrences
4. Re-enable skipped occurrences
5. Verify notifications arrive for non-skipped occurrences
6. Test notification arrival one hour before event start
7. Verify recurring events appear correctly in calendar/list views
8. Test date-based filtering with recurring events
```

This Markdown file provides a comprehensive guide for the Flutter team to implement the new recurring event features, notification management, and UI updates. The code snippets are ready to be integrated into the existing Flutter application with minimal modifications.

Made changes.