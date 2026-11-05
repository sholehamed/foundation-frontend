import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-internal-error',
    imports: [RouterLink, MatCardModule, MatButtonModule],
    templateUrl: './internal-error.component.html',
    styleUrl: './internal-error.component.scss'
})
export class InternalErrorComponent {}