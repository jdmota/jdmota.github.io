# RADICAL 2025 Presentation Notes

## Slide 1

The presentation is about ongoing PhD work.

## Slide 2

The motivating example features asynchronous JavaScript code that includes a queue that is shared between a consumer and a producer.

The consumer is responsible for taking a certain amount of items out of the queue and the producer is responsible for putting a certain amount of items into the queue.

Finally, there is a statement that starts both parties asynchronously. This code is correct, it functions as intended.

Please note that here we do not need synchronization (such as locks) to access the shared queue, because the asynchrony model of JavaScript (which is based on an "event loop") effectively ensures mutual exclusion, since when a task is running, other tasks are not executing.

The `await` keywords give us an idea of at which points there might be a context switch, from the current running task, to another one, allowing the producer and the consumer to take turns when accessing the queue.

## Slide 3

One could also imagine a similar example that uses threads instead, relying on some form of synchronization to control access to the queue, like the `synchronized` keyword in Java.

## Slide 4

The problem and research question I want to address is how to check crucial safety properties and avoid memory leaks, in programs like the ones we saw, featuring different concurrency models.
Moreover, I want to address some issues I identified in the state-of-the-art:

- No ability to distinguish between thread-local and thread-shared data, forcing the use of synchronization primitives when accessing thread-local data
- Having to choose between either a fully affine or a fully linear logic to reason about programs

Moreover, I don't want to just create yet another type system...

## Slide 5

To address this, my long term plan is to create a more general type system framework parametric over separation algebras, taking inspiration from the Iris project, to facilitate the creation of new type systems suited for asynchronous programming settings.

## Slide 6

The particular features I am interested in are the following:

Firstly, one should be able to distinguish between affine and linear resources. Affine ones should be allowed to be "dropped" and garbage collected, while the linear ones would need to be explicitly disposed.

Even in languages without manual memory management, linear resources are still useful to avoid memory leaks. For instance, in the motivating example, the queue could be treated as a linear resource until becoming empty. Another example could be a socket that is treated as linear until the `close()` method is called.

## Slide 7

Secondly, one should be able to distinguish between thread-local and thread-shared resources, and allow thread-local data to be accessed without synchronization.

For example, in JavaScript, we would treat the shared queue as a thread-local resource, but in Java, it would be a thread-shared one.

## Slide 8

Finally, I am also interested in some key forms of reasoning, crucial to make thread-local resources useful and accessible without synchronization.

First, we need to allow one to temporarily break assumptions made by thread-local resources and permit one to restore consistency before changes become visible to others. This would mean, for example, only allowing these "non-frame-preserving updates" between `await` keywords.

And then, we need to reason on degrees of separation. The idea is that if we perform a non-frame-preserving update on a set of resources, those that are strongly separated can co-exist because they are not affected, while those that are just weakly (or fictionally) separated must be "disabled" to avoid inconsistencies.

## Slide 9

To explain how these non-frame-preserving updates would work, we need some assumptions.

Let's assume we have a linear separation logic with fractional permissions, and two notions of separation, weak and strong (from the literature).

With weak separation, the permissions to access data are separated, but the underlying memory may overlap.

With strong separation, we get stronger guarantees, that, for example, `x` and `y` are not aliases.

## Slide 10

Let's also assume we have a `Queue` predicate asserting ownership of a queue referenced by a given variable, and that we split such ownership between the producer and consumer.

The idea is that we want to share access with both, permit one to prove correct the producer and the consumer, independently from each other, in a modular fashion, and then allow the composition of both proofs to get a proof of correctness for the overall program.

Traditionally, "half-of-permission" would only give us read-only access. But controlled non-frame-preserving updates will allow us to do writes.

## Slide 11

Let's see how the non-frame-preserving updates would work.

Suppose we have "half-of-permission" to the queue and we want to modify it.

First, we need to focus on such resource. This generates a focused part, which is active (in bold green, on the left), and a guarantee, or proof obligation (in blue, on the right), that must be fulfilled or restored at some point. Each guarantee is identified by a fresh token (e.g. "i").

Then we can do some changes, and after restoring the properties expressed by the `Queue` predicate, fulfilling the guarantee, we can defocus.

This idea is inspired in the work by Filipe Militão on "Rely-Guarantee Protocols", where there is a notion of focusing on a protocol, allowing one to create inconsistencies in a controlled fashion, such that these are not observed by other parties.

## Slide 12

To deal with other parties, we need frame rules.

Let's imagine we want to frame with proposition `F` that holds for strongly separated resources with respect to the queue.

In this instance, everything can proceed in the same way, because the non-frame-preserving updates will not modify, or interfere, with strongly separated resources.
This is precisely why having different notions of separation is useful: we can keep resources around if they are not affected by the updates.

## Slide 13

If we frame with weakly separated resources (such as the other "half-permission" of the queue - which would happen when composing both proofs, for the producer and the consumer), we need to "disable" the "other half" so that we do not make unsound assumptions.

The disabled part (in grey) gets associated with a set of guarantee tokens. This set tells us what guarantees must be fulfilled before re-enabling these resources. The reason why this is a set is because we will be able to nest proof obligations if we perform more than one focus operation in sequence.

Then, we can proceed in a similar fashion, do changes, and then, after fulfilling the guarantee, defocus the queue predicate, getting the "other half" enabled again.

## Slide 14

The following are some tentative rules that capture these concepts.

Inspired in Iris, we internalize updates in a core logic through an update modality.
In this case, we need a special and novel update modality that allows for these non-frame-preserving updates.

So, we have the focus rule and then, naturally, we have the defocus rule.

## Slide 15

We also have a rule that allows for the non-frame-preserving updates.
It relies on an auxiliary (also novel) update modality that is very similar to the basic Iris update modality, but instead of preserving all frames, it preserves only the strongly separated ones.

So, if we can update `P` to `Q`, preserving strongly separated frames (as we see in the premise), then we can update `P` to `Q` if it is focused.

Below is the model of the auxiliary update modality. It is very similar to the Iris' one, but adds the requirement that the frame we are checking against is strongly separated.

## Slide 16

We have a frame rule for strongly separated frames (with a version in the logic involving the update modality, and then a derived rule with Hoare triples).

And then we have a frame rule for weakly separated frames.
This rule features a special non-commutative operator whose idea and symbol are borrowed from Militão's work.

`P (*)--- F` means that we are extending `P` with a frame `F`, automatically "disabling" resources in `F` that may interfere.

To make the concept more clear, let's observe an example.

## Slide 17

Assume the first Hoare-triple holds, and that we then apply the special Frame rule.

This special framing operator looks for guarantees that are active (on the left of the operator) and disables resources (on the right of the operator) that could have suffered from interference, and may be inconsistent at these stage.

Observe that on the left-side of the Hoare-triple, nothing is disabled, since there were no active guarantees.
But on the right-side, we see that the frame we added, got disabled.

If, for example, we had active guarantees on the right of the operator, that could also interfere, those would be disabled as well, meaning that this operator allows for the nesting of proof obligations.

## Slide 18

For the non-frame-preserving updates to be sound:

- These can only be applied to thread-local resources
- Before there is a context switch, there can be no opened guarantees

This allows any asynchronous task to trust the resources it holds when it recovers control, permitting modular and independent proofs.

## Slide 19

To achieve the goal, I have started by developing a core separation logic framework, parametric over a separation algebra, with the usual separation logic connectives.
This approach is very similar to Iris, but with some differences at the outset.
For instance, I have chosen to simplify the setting by remaining in the first-order realm and avoid step-indexing.

Following already existing work, I also equipped the separation algebras with a preorder to support affine and linear resources in the same system.

## Slide 20

Finally, I generalized the notions of strong and weak (or fictional) separation by formalizing separation degrees as relations over resources. This means that instead of having two separating conjunctions, we actually just have one, and parameterize it with a separation degree.

Since, mathematically, a separation degree is effectively a set of pairs, this naturally induces a subtyping relation, defined as set inclusion. With this, we can derive a general distributivity property.

Furthermore, we can parameterize the basic update modality with a separation degree, and show that resources separated by that given degree can be framed-away.

## Slide 21

To reach the objective I need to:

- Formalize the semantic model for the novel update modality supporting non-frame-preserving updates.
- Define a suitable weakest-precondition to verify a core language with asynchronous tasks, show it is adequate, and derive some Hoare triple rules.

Finally, in the future, I would like to extract some decidable fragment to produce the type system framework.
