import {Injectable, NgZone} from '@angular/core';
import {FirestoreStorage} from './storage/firebase/firestore-storage';
import {Workshop} from '../../model/other/workshop';
import {NgSerializerService} from '@kaiu/ng-serializer';
import {AngularFirestore} from 'angularfire2/firestore';
import {Observable} from 'rxjs/Observable';
import {DocumentChangeAction} from 'angularfire2/firestore/interfaces';
import {List} from '../../model/list/list';

@Injectable()
export class WorkshopService extends FirestoreStorage<Workshop> {

    constructor(protected firestore: AngularFirestore, protected serializer: NgSerializerService, protected zone: NgZone) {
        super(firestore, serializer, zone);
    }

    getUserWorkshops(uid: string): Observable<Workshop[]> {
        return this.firestore.collection(this.getBaseUri(), ref => ref.where('authorId', '==', uid))
            .snapshotChanges()
            .map((snaps: DocumentChangeAction[]) => {
                const workshops = snaps.map(snap => {
                    const valueWithKey: Workshop = <Workshop>{$key: snap.payload.doc.id, ...snap.payload.doc.data()};
                    delete snap.payload;
                    return valueWithKey;
                });
                return this.serializer.deserialize<Workshop>(workshops, [this.getClass()]);
            });
    }

    getListsByWorkshop(lists: List[], workshops: Workshop[]): { basicLists: List[], rows: { [index: string]: List[] } } {
        const result = {basicLists: lists, rows: {}};
        workshops.forEach(workshop => {
            result.rows[workshop.$key] = [];
            lists.forEach((list) => {
                // If this list is in this workshop.
                if (workshop.listIds !== undefined && workshop.listIds.indexOf(list.$key) > -1) {
                    result.rows[workshop.$key].push(list);
                    // Remove the list from basicLists.
                    result.basicLists = result.basicLists.filter(l => l.$key !== list.$key);
                }
            });
        });
        return result;
    }

    protected getBaseUri(): string {
        return '/workshops';
    }

    protected getClass(): any {
        return Workshop;
    }

}
