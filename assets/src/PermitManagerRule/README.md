# Permit Manager Rule

![Permit Manager Rule](thumbnail.jpg)

Custom Permission Scenario Behaviour Rule that manages Custom Permissions for
AI Driver Characters.

Asset Details|&nbsp;
-|-|-
**Base KUID**|`<KUID:520252:100101>`
**Revision**|0
**Full KUID**|`<KUID2:520252:100101:0>`
**Trainz Version**|T:ANE SP2 (`Build: 88364`)

The Permit Manager Rule allows you to define custom Permission that can be requested by AI Driver Characters. This works very much like the [WaitForJunctionPermit](https://www.auran.com/DLS/DLS_viewasset.php?AssetID=57630) command, but does not require a specific Track or Junction object in the map.  
This is useful when creating Scenarios for Routes that are owned by someone else. It also negates the need to create ghost rails and junctions on the map that are not used or not part of the rail network.

Custom permissions are defined by adding the *PermitManagerRule* to your sessions rules and clicking <kbd>Edit</kbd>.

## Examples

Custom Permit Types can either grant shared or exclusive access to a Permit Object. Here are examples for both access modes.

### Exclusive (non-shared) Permit Types

By default a Permit Type does not grant shared access. This means a Permission can only be granted to one AI Driver at a time. While an AI Driver holds a grant for a Permit Object, other AI Drivers cannot obtain access to that Permit Object. *In Computer Science, this mechanism is called: __Mutual Exclusion__.*

A Turntable is an excellent use-case for a non-shared Permit Type.  
While a Driver is operating a Turntable (e.g. using the [Move Turntable](https://www.auran.com/DLS/DLS_viewasset.php?AssetID=201748) command), no other Drivers should operate the turntable.

Consider the Drivers *Adair* and *Bob* which are both sitting in their locomotives each on their own track in a Roundhouse. A Turntable connects all tracks in the Roundhouse. Now the following happens:

1. *Adair* moves the turntable to his track.
2. While the Turntable moves to *Adair*, *Bob* also issues a command to move the turntable towards *Bob*.

Towards whom should the turntable turn? Even if the Turntable was smart (which it is not) first turning towards *Adair*, then turning towards *Bob* would not solve the problem, as *Adair* problably expects the Turntable to be positioned towards him when his `Move Turntable` command finishes. The same is true for *Bob*.

By using a Permit Type (let's call it `exclusive`) and defining a Permit Object (let's call it `Turntable`), we can now ensure mutual exclusion access to the Turntable:

1. *Adair* requests a Permit of type `exclusive` for `Turntable`.
2. The Permit Manager grants *Adair* acess immediately, since no one current holds an Access Grant for `Turntable`.
3. *Adair* issues the `Move Turntable` command to move the turntable to his track.
4. *Bob* requests a Permit of Type `exclusive` for `Turntable`.
5. The Permit Manager enqueues *Bob*, since *Adair* holds an Access Grant for `turntable` and the type of that grant is *not shared*. *Bob* continues waiting for his Access Request to be granted.
6. The Turntable finishes moving and *Adair* navigates onto the turntable track, moves it again to his exit, and then moves off the track. *Bob* continues waiting for his Access Request to be granted.
7. Once he is clear of the Turntable track, *Adair* releases his `exclusive` Access Grant for `Turntable`.
8. The Permit Manager deletes *Adair*'s Access Grant and dequeues the pending Request from *Bob*, and the grants access to *Bob*.
9. *Bob* operates the turnable, exits the Roundhouse and releases his grant, when he also is clear of the Turntable.

As you can see, access to the Turntable is guarded by the Permission Manager. However, this only works if all participants request and release Access via the Permit Manager. It is also important that the Drivers release thir grants as soon as possible, so that pending requests can be granted.

Also note that this can cause a deadlock situation, in case a single Driver tries to obtain exclusive access to the same Permit Object twice. In such a case, the seconds request will never be granted and the Driver will wait infinitely.

### Shared Permit Types

A shared Permit Type works very much like a non-shared Permit Type, but allows multiple Drivers to obtain grants for a Permit Object.

Consider a long stretch of single-line track (let's assume that is runs form North to South). The track might be signalled in multiple blocks allowing more than one train to travel on it at the same time. While the signals will manage traffic flow correctly, it can result in a *Mexican Standoff* situation, where two trains wait oppsite each other in the middle of the track.

1. For such situations, you can create two Permit Types `northbound` and `southbound` and set both permit types to `shared`.
2. Now, create a Permit Object for the long strech of single-line track. (E.g. `Single-Line-Track`)

Instruct all Drivers to acquire the respective Permissions for north- or southbound traffic.

The Permit Manager will grant shared access under the following conditions:
* The currently granted Access to a Permit Object is the same as the requested Access.
* The Requested Permit Type is shared.
* There are no pending requests for a different Permit Type.

The last bullet point will cause the Permit Manager to treat requests fairly, prohibiting a phenonemon called *Starvation*. Without this rule, a southbound train could potentially be left stranded, if there was a continous stream of northbound trains. With this rule, north- and southbound trains can alternate their access.

## Implementation Details

> Code: [PermitManagerRule.gs](PermitManagerRule.gs)

On initialisation the Scenario Behaviour spawns a MessageHandler Thread that will listen for Permit Manager Messages and process them accordingly.

Permit Objects are implemented as so called [Mutual Exclusion objects](https://en.wikipedia.org/wiki/Lock_%28computer_science%29), which are common thread synchronisation primitives used in Computer Science. 
> In computer science, a lock or mutex (from mutual exclusion) is a synchronization mechanism for enforcing limits on access to a resource in an environment where there are many threads of execution. A lock is designed to enforce a mutual exclusion concurrency control policy.

E.g. the Windows Operating System can create Mutex objects to ensure that only a single thread is accessing a File on disk at the same time.  
The implementation of this asset uses similar techniques.

However, Permit Types for Permission Objects can also be set to share granted permissions across mutiple AI Driver Characters. This shared mechnanism allows multiple AI Drivers to be granted access to a permission at the same time. In Computer Science such a mechanism is commonly known as a [Semaphore](https://en.wikipedia.org/wiki/Semaphore_%28programming%29) (**NOT the Railway Signal!**) (in this case with an unlimited maximum).
> In computer science, a semaphore is an abstract data type used to control access to a common resource by multiple processes in a concurrent system.

Using a single Message Handler thread ensures that all messages are processed synchronously by the same thread to properly ensure mutual exclusion and thread safety of the Permission Objects.
If the common GSObject method [`AddHandler`](../../../../auran-ref/TANE/scripts/gs.gs#L71) were used, the Router would just invoke the processing methods in the rule on behalf of the sender, potentially causing multiple threads to edit the Permission Manager state at the same time.


